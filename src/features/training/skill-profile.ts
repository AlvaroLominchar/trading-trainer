import {
  TRAINING_SKILLS,
  type TrainingSkill,
} from "./types";

export const SKILL_PROFILE_ATTEMPT_LIMIT = 60;
export const SKILL_PROFILE_RECENT_SCORE_LIMIT = 6;
export const SKILL_PROFILE_SIGNAL_MIN_OBSERVATIONS = 2;
export const SKILL_PROFILE_SIGNAL_MIN_EXERCISES = 2;
export const SKILL_PROFILE_SIGNAL_MIN_GAP = 5;

export type SkillProfileAttemptScore = {
  skill: TrainingSkill;
  score: number;
  weight: number;
};

export type SkillProfileAttempt = {
  id: string;
  exerciseId: string;
  createdAt: string;
  skillScores: readonly SkillProfileAttemptScore[];
};

export type SkillProfileMetric = {
  skill: TrainingSkill;
  score: number | null;
  latestScore: number | null;
  observations: number;
  uniqueExercises: number;
  recentScores: readonly number[];
};

export type SkillProfile = {
  attemptsAnalyzed: number;
  uniqueExercises: number;
  skillsMeasured: number;
  metrics: readonly SkillProfileMetric[];
  strongestSkill: SkillProfileMetric | null;
  focusSkill: SkillProfileMetric | null;
};

const SKILLS = new Set<TrainingSkill>(TRAINING_SKILLS);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isScore(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0 && value <= 100;
}

function parseSkillScores(
  value: unknown,
): readonly SkillProfileAttemptScore[] | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const seenSkills = new Set<TrainingSkill>();
  const scores: SkillProfileAttemptScore[] = [];

  for (const item of value) {
    if (
      !isRecord(item) ||
      typeof item.skill !== "string" ||
      !SKILLS.has(item.skill as TrainingSkill) ||
      !isScore(item.score) ||
      !isFiniteNumber(item.weight) ||
      item.weight <= 0
    ) {
      return null;
    }

    const skill = item.skill as TrainingSkill;

    if (seenSkills.has(skill)) {
      return null;
    }

    seenSkills.add(skill);
    scores.push({
      skill,
      score: item.score,
      weight: item.weight,
    });
  }

  return scores;
}

export function parseSkillProfileAttempt(
  value: unknown,
): SkillProfileAttempt | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.exercise_id !== "string" ||
    value.exercise_id.length === 0 ||
    typeof value.created_at !== "string" ||
    Number.isNaN(Date.parse(value.created_at))
  ) {
    return null;
  }

  const skillScores = parseSkillScores(value.skill_scores);

  if (!skillScores) {
    return null;
  }

  return {
    id: value.id,
    exerciseId: value.exercise_id,
    createdAt: value.created_at,
    skillScores,
  };
}

function average(scores: readonly number[]) {
  return Math.round(
    scores.reduce((total, score) => total + score, 0) / scores.length,
  );
}

function getSignalCandidates(
  metrics: readonly SkillProfileMetric[],
) {
  return metrics.filter(
    (metric) =>
      metric.score !== null &&
      metric.observations >= SKILL_PROFILE_SIGNAL_MIN_OBSERVATIONS &&
      metric.uniqueExercises >= SKILL_PROFILE_SIGNAL_MIN_EXERCISES,
  );
}

function getSignalSkills(
  metrics: readonly SkillProfileMetric[],
): Pick<SkillProfile, "strongestSkill" | "focusSkill"> {
  const candidates = getSignalCandidates(metrics);

  if (candidates.length < 2) {
    return {
      strongestSkill: null,
      focusSkill: null,
    };
  }

  const ordered = [...candidates].sort((left, right) => {
    const scoreDifference = (right.score ?? 0) - (left.score ?? 0);

    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    const exerciseDifference = right.uniqueExercises - left.uniqueExercises;

    if (exerciseDifference !== 0) {
      return exerciseDifference;
    }

    const observationDifference = right.observations - left.observations;

    if (observationDifference !== 0) {
      return observationDifference;
    }

    return TRAINING_SKILLS.indexOf(left.skill) - TRAINING_SKILLS.indexOf(right.skill);
  });

  const strongestSkill = ordered[0] ?? null;
  const focusSkill = ordered.at(-1) ?? null;

  if (
    !strongestSkill ||
    !focusSkill ||
    strongestSkill.score === null ||
    focusSkill.score === null ||
    strongestSkill.score - focusSkill.score < SKILL_PROFILE_SIGNAL_MIN_GAP
  ) {
    return {
      strongestSkill: null,
      focusSkill: null,
    };
  }

  return {
    strongestSkill,
    focusSkill,
  };
}

export function buildSkillProfile(
  attempts: readonly SkillProfileAttempt[],
): SkillProfile {
  const metrics = TRAINING_SKILLS.map((skill) => {
    const observations: number[] = [];
    const exerciseIds = new Set<string>();

    for (const attempt of attempts) {
      const skillScore = attempt.skillScores.find(
        (item) => item.skill === skill,
      );

      if (!skillScore) {
        continue;
      }

      observations.push(skillScore.score);
      exerciseIds.add(attempt.exerciseId);
    }

    return {
      skill,
      score: observations.length > 0 ? average(observations) : null,
      latestScore: observations[0] ?? null,
      observations: observations.length,
      uniqueExercises: exerciseIds.size,
      recentScores: observations
        .slice(0, SKILL_PROFILE_RECENT_SCORE_LIMIT)
        .reverse(),
    } satisfies SkillProfileMetric;
  });

  const signalSkills = getSignalSkills(metrics);

  return {
    attemptsAnalyzed: attempts.length,
    uniqueExercises: new Set(attempts.map((attempt) => attempt.exerciseId)).size,
    skillsMeasured: metrics.filter((metric) => metric.score !== null).length,
    metrics,
    ...signalSkills,
  };
}
