
import {
  TRAINING_SKILLS,
  type ManagementAction,
  type TradePlan,
  type TradePlanComponent,
  type TrainingDecision,
  type TrainingSkill,
} from "./types";

export const TRAINING_HISTORY_LIMIT = 30;

export const TRAINING_HISTORY_OUTCOMES = [
  "no_trade",
  "stop_hit",
  "target_hit",
  "ambiguous",
  "manual_close",
  "scenario_end",
] as const;

export type TrainingHistoryOutcome =
  (typeof TRAINING_HISTORY_OUTCOMES)[number];

export type TrainingHistorySkillScore = {
  skill: TrainingSkill;
  score: number;
  weight: number;
};

export type TrainingHistoryPlanComponentScore = {
  component: TradePlanComponent;
  score: number;
  weight: number;
};

export type TrainingHistoryManagementAction = {
  checkpointOffset: number;
  action: ManagementAction;
  score: number;
  summary: string;
  reasons: readonly string[];
  protectedRiskR: number | null;
  placementScore: number | null;
  stop: number | null;
};

export type TrainingHistoryAttempt = {
  id: string;
  exerciseId: string;
  exerciseTitle: string;
  timeframe: string;
  decision: TrainingDecision;
  confidence: number;
  waitCount: number;
  tradePlan: TradePlan | null;
  ideaScore: number;
  ideaRating: string;
  isTopRatedDecision: boolean;
  skillScores: readonly TrainingHistorySkillScore[];
  ideaSummary: string;
  ideaReasons: readonly string[];
  planScore: number | null;
  planComponentScores: readonly TrainingHistoryPlanComponentScore[] | null;
  managementScore: number | null;
  managementActions: readonly TrainingHistoryManagementAction[];
  outcome: TrainingHistoryOutcome;
  exitPrice: number | null;
  createdAt: string;
};

const DECISIONS = new Set<TrainingDecision>([
  "long",
  "no_trade",
  "short",
]);

const SKILLS = new Set<TrainingSkill>(TRAINING_SKILLS);

const PLAN_COMPONENTS = new Set<TradePlanComponent>([
  "entry",
  "invalidation",
  "target",
  "reward_risk",
]);

const MANAGEMENT_ACTIONS = new Set<ManagementAction>([
  "hold",
  "close",
  "move_stop",
]);

const OUTCOMES = new Set<TrainingHistoryOutcome>(TRAINING_HISTORY_OUTCOMES);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNullableFiniteNumber(value: unknown): value is number | null {
  return value === null || isFiniteNumber(value);
}

function isScore(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0 && value <= 100;
}

function isNullableScore(value: unknown): value is number | null {
  return value === null || isScore(value);
}

function parseStringArray(value: unknown): readonly string[] | null {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    return null;
  }

  return value;
}

function parseTradePlan(value: unknown): TradePlan | null | undefined {
  if (value === null) {
    return null;
  }

  if (
    !isRecord(value) ||
    !isFiniteNumber(value.entry) ||
    !isFiniteNumber(value.stop) ||
    !isFiniteNumber(value.target)
  ) {
    return undefined;
  }

  return {
    entry: value.entry,
    stop: value.stop,
    target: value.target,
  };
}

function parseSkillScores(
  value: unknown,
): readonly TrainingHistorySkillScore[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const scores: TrainingHistorySkillScore[] = [];

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

    scores.push({
      skill: item.skill as TrainingSkill,
      score: item.score,
      weight: item.weight,
    });
  }

  return scores;
}

function parsePlanComponentScores(
  value: unknown,
): readonly TrainingHistoryPlanComponentScore[] | null | undefined {
  if (value === null) {
    return null;
  }

  if (!Array.isArray(value)) {
    return undefined;
  }

  const scores: TrainingHistoryPlanComponentScore[] = [];

  for (const item of value) {
    if (
      !isRecord(item) ||
      typeof item.component !== "string" ||
      !PLAN_COMPONENTS.has(item.component as TradePlanComponent) ||
      !isScore(item.score) ||
      !isFiniteNumber(item.weight) ||
      item.weight <= 0
    ) {
      return undefined;
    }

    scores.push({
      component: item.component as TradePlanComponent,
      score: item.score,
      weight: item.weight,
    });
  }

  return scores;
}

function parseManagementActions(
  value: unknown,
): readonly TrainingHistoryManagementAction[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const actions: TrainingHistoryManagementAction[] = [];

  for (const item of value) {
    if (
      !isRecord(item) ||
      !Number.isInteger(item.checkpointOffset) ||
      (item.checkpointOffset as number) < 1 ||
      typeof item.action !== "string" ||
      !MANAGEMENT_ACTIONS.has(item.action as ManagementAction) ||
      !isScore(item.score) ||
      typeof item.summary !== "string" ||
      !isNullableFiniteNumber(item.protectedRiskR) ||
      !isNullableScore(item.placementScore) ||
      !isNullableFiniteNumber(item.stop)
    ) {
      return null;
    }

    const reasons = parseStringArray(item.reasons);

    if (!reasons) {
      return null;
    }

    actions.push({
      checkpointOffset: item.checkpointOffset as number,
      action: item.action as ManagementAction,
      score: item.score,
      summary: item.summary,
      reasons,
      protectedRiskR: item.protectedRiskR,
      placementScore: item.placementScore,
      stop: item.stop,
    });
  }

  return actions;
}

export function parseTrainingHistoryAttempt(
  value: unknown,
): TrainingHistoryAttempt | null {
  if (!isRecord(value)) {
    return null;
  }

  const waitCount =
    value.wait_count === undefined || value.wait_count === null
      ? 0
      : Number.isInteger(value.wait_count) &&
          (value.wait_count as number) >= 0 &&
          (value.wait_count as number) <= 3
        ? (value.wait_count as number)
        : null;

  if (waitCount === null) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.exercise_id !== "string" ||
    !value.exercise_id.trim() ||
    typeof value.exercise_title !== "string" ||
    typeof value.timeframe !== "string" ||
    typeof value.decision !== "string" ||
    !DECISIONS.has(value.decision as TrainingDecision) ||
    !Number.isInteger(value.confidence) ||
    (value.confidence as number) < 50 ||
    (value.confidence as number) > 100 ||
    !isScore(value.idea_score) ||
    typeof value.idea_rating !== "string" ||
    typeof value.is_top_rated_decision !== "boolean" ||
    typeof value.idea_summary !== "string" ||
    !isNullableScore(value.plan_score) ||
    !isNullableScore(value.management_score) ||
    typeof value.outcome !== "string" ||
    !OUTCOMES.has(value.outcome as TrainingHistoryOutcome) ||
    !isNullableFiniteNumber(value.exit_price) ||
    typeof value.created_at !== "string" ||
    Number.isNaN(Date.parse(value.created_at))
  ) {
    return null;
  }

  const tradePlan = parseTradePlan(value.trade_plan);
  const skillScores = parseSkillScores(value.skill_scores);
  const ideaReasons = parseStringArray(value.idea_reasons);
  const planComponentScores = parsePlanComponentScores(
    value.plan_component_scores,
  );
  const managementActions = parseManagementActions(value.management_actions);

  if (
    tradePlan === undefined ||
    !skillScores ||
    !ideaReasons ||
    planComponentScores === undefined ||
    !managementActions
  ) {
    return null;
  }

  if (
    (value.decision === "no_trade" &&
      (tradePlan !== null ||
        value.plan_score !== null ||
        planComponentScores !== null ||
        value.management_score !== null ||
        managementActions.length > 0 ||
        value.outcome !== "no_trade")) ||
    (value.decision !== "no_trade" &&
      (tradePlan === null ||
        value.plan_score === null ||
        planComponentScores === null ||
        value.outcome === "no_trade"))
  ) {
    return null;
  }

  return {
    id: value.id,
    exerciseId: value.exercise_id,
    exerciseTitle: value.exercise_title,
    timeframe: value.timeframe,
    decision: value.decision as TrainingDecision,
    confidence: value.confidence as number,
    waitCount,
    tradePlan,
    ideaScore: value.idea_score,
    ideaRating: value.idea_rating,
    isTopRatedDecision: value.is_top_rated_decision,
    skillScores,
    ideaSummary: value.idea_summary,
    ideaReasons,
    planScore: value.plan_score,
    planComponentScores,
    managementScore: value.management_score,
    managementActions,
    outcome: value.outcome as TrainingHistoryOutcome,
    exitPrice: value.exit_price,
    createdAt: value.created_at,
  };
}

export function getDecisionLabel(decision: TrainingDecision) {
  switch (decision) {
    case "long":
      return "Largo";
    case "short":
      return "Corto";
    case "no_trade":
      return "No operar";
  }
}

export function getOutcomeLabel(outcome: TrainingHistoryOutcome) {
  switch (outcome) {
    case "no_trade":
      return "Sin operación";
    case "stop_hit":
      return "Stop ejecutado";
    case "target_hit":
      return "Objetivo alcanzado";
    case "ambiguous":
      return "Vela ambigua";
    case "manual_close":
      return "Cierre manual";
    case "scenario_end":
      return "Fin del escenario";
  }
}

export function getSkillLabel(skill: TrainingSkill) {
  switch (skill) {
    case "context_reading":
      return "Contexto";
    case "trend_reading":
      return "Tendencia";
    case "range_reading":
      return "Rango";
    case "discipline":
      return "Disciplina";
    case "false_breakout":
      return "Falsa ruptura";
    case "breakout_reading":
      return "Rupturas";
    case "volatility_reading":
      return "Volatilidad";
    case "exhaustion_reading":
      return "Agotamiento";
    case "retest_reading":
      return "Retests";
    case "entry_timing":
      return "Timing";
  }
}

export function getPlanComponentLabel(component: TradePlanComponent) {
  switch (component) {
    case "entry":
      return "Entrada";
    case "invalidation":
      return "Invalidación";
    case "target":
      return "Objetivo";
    case "reward_risk":
      return "R:R";
  }
}

export function getManagementActionLabel(action: ManagementAction) {
  switch (action) {
    case "hold":
      return "Mantener";
    case "close":
      return "Cerrar";
    case "move_stop":
      return "Proteger";
  }
}
