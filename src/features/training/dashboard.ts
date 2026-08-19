import {
  buildSkillProfile,
  type SkillProfile,
} from "./skill-profile";
import {
  getDecisionLabel,
  getOutcomeLabel,
  getSkillLabel,
  type TrainingHistoryAttempt,
} from "./history";
import type { TrainingDecision, TrainingSkill } from "./types";

export const DASHBOARD_ATTEMPT_WINDOW = 24;
export const DASHBOARD_RECENT_ATTEMPTS_LIMIT = 3;
export const DASHBOARD_SKILL_PREVIEW_LIMIT = 5;

export type DashboardStageMetric = {
  key: "idea" | "plan" | "management";
  label: string;
  score: number | null;
  attemptCount: number;
};

export type DashboardDecisionMetric = {
  decision: TrainingDecision;
  label: string;
  count: number;
  share: number;
};

export type DashboardSkillMetric = {
  skill: TrainingSkill;
  label: string;
  score: number;
  observations: number;
  uniqueExercises: number;
};

export type DashboardRecentAttempt = {
  id: string;
  title: string;
  timeframe: string;
  createdAt: string;
  decisionLabel: string;
  outcomeLabel: string;
  ideaScore: number;
  planScore: number | null;
  managementScore: number | null;
};

export type TrainingDashboardSummary = {
  totalAttempts: number;
  attemptsAnalyzed: number;
  uniqueExercises: number;
  topRatedCount: number;
  topRatedShare: number;
  stageMetrics: readonly DashboardStageMetric[];
  decisionMetrics: readonly DashboardDecisionMetric[];
  skillMetrics: readonly DashboardSkillMetric[];
  strongestSkill: DashboardSkillMetric | null;
  focusSkill: DashboardSkillMetric | null;
  recentAttempts: readonly DashboardRecentAttempt[];
};

function roundAverage(scores: readonly number[]) {
  return Math.round(
    scores.reduce((total, score) => total + score, 0) / scores.length,
  );
}

function toShare(count: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((count / total) * 100);
}

function buildStageMetrics(
  attempts: readonly TrainingHistoryAttempt[],
): readonly DashboardStageMetric[] {
  const ideaScores = attempts.map((attempt) => attempt.ideaScore);
  const planScores = attempts.flatMap((attempt) =>
    attempt.planScore === null ? [] : [attempt.planScore],
  );
  const managementScores = attempts.flatMap((attempt) =>
    attempt.managementScore === null ? [] : [attempt.managementScore],
  );

  return [
    {
      key: "idea",
      label: "Lectura",
      score: ideaScores.length > 0 ? roundAverage(ideaScores) : null,
      attemptCount: ideaScores.length,
    },
    {
      key: "plan",
      label: "Plan",
      score: planScores.length > 0 ? roundAverage(planScores) : null,
      attemptCount: planScores.length,
    },
    {
      key: "management",
      label: "Gestión",
      score:
        managementScores.length > 0
          ? roundAverage(managementScores)
          : null,
      attemptCount: managementScores.length,
    },
  ] satisfies readonly DashboardStageMetric[];
}

function buildDecisionMetrics(
  attempts: readonly TrainingHistoryAttempt[],
): readonly DashboardDecisionMetric[] {
  const total = attempts.length;

  return (["long", "short", "no_trade"] as const).map((decision) => {
    const count = attempts.filter((attempt) => attempt.decision === decision).length;

    return {
      decision,
      label: getDecisionLabel(decision),
      count,
      share: toShare(count, total),
    } satisfies DashboardDecisionMetric;
  });
}

function toDashboardSkillMetric(
  metric: SkillProfile["metrics"][number],
): DashboardSkillMetric | null {
  if (metric.score === null) {
    return null;
  }

  return {
    skill: metric.skill,
    label: getSkillLabel(metric.skill),
    score: metric.score,
    observations: metric.observations,
    uniqueExercises: metric.uniqueExercises,
  };
}

function fallbackSkillProfile(
  attempts: readonly TrainingHistoryAttempt[],
): SkillProfile {
  return buildSkillProfile(
    attempts.map((attempt) => ({
      id: attempt.id,
      exerciseId: attempt.exerciseTitle,
      createdAt: attempt.createdAt,
      skillScores: attempt.skillScores,
    })),
  );
}

function buildRecentAttempts(
  attempts: readonly TrainingHistoryAttempt[],
): readonly DashboardRecentAttempt[] {
  return attempts.slice(0, DASHBOARD_RECENT_ATTEMPTS_LIMIT).map((attempt) => ({
    id: attempt.id,
    title: attempt.exerciseTitle,
    timeframe: attempt.timeframe,
    createdAt: attempt.createdAt,
    decisionLabel: getDecisionLabel(attempt.decision),
    outcomeLabel: getOutcomeLabel(attempt.outcome),
    ideaScore: attempt.ideaScore,
    planScore: attempt.planScore,
    managementScore: attempt.managementScore,
  }));
}

export function buildTrainingDashboard(
  attempts: readonly TrainingHistoryAttempt[],
  options?: {
    totalAttempts?: number;
    skillProfile?: SkillProfile;
  },
): TrainingDashboardSummary {
  const orderedAttempts = [...attempts].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );

  const totalAttempts = Math.max(
    options?.totalAttempts ?? orderedAttempts.length,
    orderedAttempts.length,
  );
  const skillProfile = options?.skillProfile ?? fallbackSkillProfile(orderedAttempts);
  const skillMetrics = skillProfile.metrics
    .map(toDashboardSkillMetric)
    .filter((metric): metric is DashboardSkillMetric => metric !== null);
  const strongestSkill = skillProfile.strongestSkill
    ? toDashboardSkillMetric(skillProfile.strongestSkill)
    : null;
  const focusSkill = skillProfile.focusSkill
    ? toDashboardSkillMetric(skillProfile.focusSkill)
    : null;
  const topRatedCount = orderedAttempts.filter(
    (attempt) => attempt.isTopRatedDecision,
  ).length;

  return {
    totalAttempts,
    attemptsAnalyzed: orderedAttempts.length,
    uniqueExercises: new Set(
      orderedAttempts.map((attempt) => attempt.exerciseTitle),
    ).size,
    topRatedCount,
    topRatedShare: toShare(topRatedCount, orderedAttempts.length),
    stageMetrics: buildStageMetrics(orderedAttempts),
    decisionMetrics: buildDecisionMetrics(orderedAttempts),
    skillMetrics: skillMetrics.slice(0, DASHBOARD_SKILL_PREVIEW_LIMIT),
    strongestSkill,
    focusSkill,
    recentAttempts: buildRecentAttempts(orderedAttempts),
  } satisfies TrainingDashboardSummary;
}
