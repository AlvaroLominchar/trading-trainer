import type { ExerciseDifficulty } from "./difficulty";
import {
  SKILL_PROFILE_SIGNAL_MIN_EXERCISES,
  SKILL_PROFILE_SIGNAL_MIN_OBSERVATIONS,
  type SkillProfile,
  type SkillProfileMetric,
} from "./skill-profile";
import { TRAINING_SKILLS, type TrainingSkill } from "./types";

export const ADAPTIVE_SELECTION_VERSION = 1;

export type AdaptiveSelectionStrategy = "coverage" | "reinforcement";

export type AdaptiveSelectionPreferences = {
  version: typeof ADAPTIVE_SELECTION_VERSION;
  targetSkill: TrainingSkill;
  targetDifficulty: ExerciseDifficulty;
  strategy: AdaptiveSelectionStrategy;
};

function average(values: readonly number[]) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function deterministicUnit(seed: number, salt: string) {
  let hash = 2166136261 ^ (seed >>> 0);

  for (let index = 0; index < salt.length; index += 1) {
    hash ^= salt.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x7feb352d);
  hash ^= hash >>> 15;
  hash = Math.imul(hash, 0x846ca68b);
  hash ^= hash >>> 16;

  return (hash >>> 0) / 4_294_967_296;
}

function getRecentAverage(metric: SkillProfileMetric) {
  if (metric.recentScores.length === 0) {
    return metric.score;
  }

  return average(metric.recentScores.slice(-3));
}

function getTargetDifficulty(
  metric: SkillProfileMetric,
): ExerciseDifficulty {
  const recentAverage = getRecentAverage(metric);

  if (
    metric.score === null ||
    recentAverage === null ||
    metric.observations < 3 ||
    metric.uniqueExercises < 2
  ) {
    return "easy";
  }

  const blendedScore = metric.score * 0.65 + recentAverage * 0.35;

  if (blendedScore < 60) {
    return "easy";
  }

  if (
    blendedScore < 82 ||
    metric.observations < 5 ||
    metric.uniqueExercises < 3
  ) {
    return "medium";
  }

  return "hard";
}

function chooseCoverageMetric(
  metrics: readonly SkillProfileMetric[],
  selectionSeed: number,
) {
  const ordered = [...metrics].sort((left, right) => {
    const uniqueDifference = left.uniqueExercises - right.uniqueExercises;

    if (uniqueDifference !== 0) {
      return uniqueDifference;
    }

    const observationDifference = left.observations - right.observations;

    if (observationDifference !== 0) {
      return observationDifference;
    }

    return TRAINING_SKILLS.indexOf(left.skill) - TRAINING_SKILLS.indexOf(right.skill);
  });
  const minimumUniqueExercises = ordered[0]?.uniqueExercises ?? 0;
  const minimumObservations = Math.min(
    ...ordered
      .filter((metric) => metric.uniqueExercises === minimumUniqueExercises)
      .map((metric) => metric.observations),
  );
  const tied = ordered.filter(
    (metric) =>
      metric.uniqueExercises === minimumUniqueExercises &&
      metric.observations === minimumObservations,
  );
  const index = Math.floor(
    deterministicUnit(selectionSeed, "adaptive-coverage:v1") * tied.length,
  );

  return tied[index] ?? ordered[0];
}

function getReinforcementPriority(metric: SkillProfileMetric) {
  if (metric.score === null) {
    return Number.NEGATIVE_INFINITY;
  }

  const recentAverage = getRecentAverage(metric) ?? metric.score;
  const overallWeakness = 100 - metric.score;
  const recentWeakness = 100 - recentAverage;
  const exposureGap = Math.max(0, 6 - metric.observations) * 2;

  return overallWeakness * 0.55 + recentWeakness * 0.35 + exposureGap;
}

function chooseReinforcementMetric(
  metrics: readonly SkillProfileMetric[],
  selectionSeed: number,
) {
  const ordered = [...metrics].sort((left, right) => {
    const priorityDifference =
      getReinforcementPriority(right) - getReinforcementPriority(left);

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return TRAINING_SKILLS.indexOf(left.skill) - TRAINING_SKILLS.indexOf(right.skill);
  });
  const shortlist = ordered.slice(0, Math.min(3, ordered.length));
  const roll = deterministicUnit(selectionSeed, "adaptive-reinforcement:v1");
  const index = roll < 0.6 ? 0 : roll < 0.88 ? 1 : 2;

  return shortlist[Math.min(index, shortlist.length - 1)] ?? ordered[0];
}

export function getAdaptiveSelectionPreferences(
  profile: SkillProfile,
  selectionSeed: number,
  options: { avoidSkill?: TrainingSkill | null } = {},
): AdaptiveSelectionPreferences {
  const coverageMetrics = profile.metrics.filter(
    (metric) =>
      metric.observations < SKILL_PROFILE_SIGNAL_MIN_OBSERVATIONS ||
      metric.uniqueExercises < SKILL_PROFILE_SIGNAL_MIN_EXERCISES,
  );

  if (coverageMetrics.length > 0) {
    const alternatives = coverageMetrics.filter(
      (metric) => metric.skill !== options.avoidSkill,
    );
    const target = chooseCoverageMetric(
      alternatives.length > 0 ? alternatives : coverageMetrics,
      selectionSeed,
    );

    return {
      version: ADAPTIVE_SELECTION_VERSION,
      targetSkill: target?.skill ?? TRAINING_SKILLS[0],
      targetDifficulty: target
        ? getTargetDifficulty(target)
        : "easy",
      strategy: "coverage",
    };
  }

  const reinforcementMetrics = profile.metrics.filter(
    (metric) =>
      metric.score !== null &&
      metric.observations >= SKILL_PROFILE_SIGNAL_MIN_OBSERVATIONS &&
      metric.uniqueExercises >= SKILL_PROFILE_SIGNAL_MIN_EXERCISES,
  );
  const reinforcementPool =
    reinforcementMetrics.length > 0 ? reinforcementMetrics : profile.metrics;
  const reinforcementAlternatives = reinforcementPool.filter(
    (metric) => metric.skill !== options.avoidSkill,
  );
  const target = chooseReinforcementMetric(
    reinforcementAlternatives.length > 0
      ? reinforcementAlternatives
      : reinforcementPool,
    selectionSeed,
  );

  return {
    version: ADAPTIVE_SELECTION_VERSION,
    targetSkill: target?.skill ?? TRAINING_SKILLS[0],
    targetDifficulty: target
      ? getTargetDifficulty(target)
      : "easy",
    strategy: "reinforcement",
  };
}
