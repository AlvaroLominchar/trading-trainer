export const TRAINING_DECISIONS = ["long", "no_trade", "short"] as const;

export type TrainingDecision = (typeof TRAINING_DECISIONS)[number];

export const DIRECTIONAL_DECISIONS = ["long", "short"] as const;

export type DirectionalDecision = (typeof DIRECTIONAL_DECISIONS)[number];

export const TRAINING_SKILLS = [
  "context_reading",
  "trend_reading",
  "range_reading",
  "discipline",
  "false_breakout",
] as const;

export type TrainingSkill = (typeof TRAINING_SKILLS)[number];

export type ExerciseTimeframe = "5m" | "15m" | "1h";

export type Candle = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type ExerciseSkillWeight = {
  skill: TrainingSkill;
  weight: number;
};

export type DecisionRubric = {
  skillScores: Partial<Record<TrainingSkill, number>>;
  summary: string;
  reasons: readonly string[];
};

export type ExerciseRubric = {
  version: 1;
  decisions: Record<TrainingDecision, DecisionRubric>;
};

export type ExerciseSource = {
  kind: "synthetic";
  label: string;
};

export type PriceZone = {
  min: number;
  max: number;
};

export type PriceZoneRubric = {
  optimal: PriceZone;
  acceptable: PriceZone;
};

export type TradePlan = {
  entry: number;
  stop: number;
  target: number;
};

export type TradePlanRubric = {
  entry: PriceZoneRubric;
  stop: PriceZoneRubric;
  target: PriceZoneRubric;
  minimumRewardRisk: number;
  idealRewardRisk: number;
  weights: {
    entry: number;
    invalidation: number;
    target: number;
    rewardRisk: number;
  };
};

export type TradePlanComponent =
  | "entry"
  | "invalidation"
  | "target"
  | "reward_risk";

export type TradePlanComponentScore = {
  component: TradePlanComponent;
  score: number;
  weight: number;
};

export type TradePlanResult = {
  decision: DirectionalDecision;
  plan: TradePlan;
  rewardRisk: number;
  overallScore: number;
  componentScores: readonly TradePlanComponentScore[];
};


export const MANAGEMENT_ACTIONS = ["hold", "close", "move_stop"] as const;

export type ManagementAction = (typeof MANAGEMENT_ACTIONS)[number];

export type ManagementActionInput =
  | { action: "hold" }
  | { action: "close" }
  | { action: "move_stop"; stop: number };

export type ManagementFixedActionRubric = {
  score: number;
  summary: string;
  reasons: readonly string[];
};

export type ManagementMoveStopRubric = {
  baseScore: number;
  placementWeight: number;
  protectedRisk: PriceZoneRubric;
  summary: string;
  reasons: readonly string[];
};

export type ManagementCheckpointRubric = {
  afterRevealOffset: number;
  actions: {
    hold: ManagementFixedActionRubric;
    close: ManagementFixedActionRubric;
    move_stop: ManagementMoveStopRubric;
  };
};

export type ExerciseManagementRubric = {
  version: 1;
  checkpoints: readonly ManagementCheckpointRubric[];
};

export type ManagementPositionState = {
  entry: number;
  target: number;
  initialStop: number;
  activeStop: number;
};

export type ManagementCandleStatus =
  | "open"
  | "stop_hit"
  | "target_hit"
  | "ambiguous";

export type ManagementCandleEvaluation = {
  status: ManagementCandleStatus;
  exitPrice: number | null;
};

export type ManagementActionScore = {
  checkpointOffset: number;
  action: ManagementAction;
  score: number;
  summary: string;
  reasons: readonly string[];
  protectedRiskR: number | null;
  placementScore: number | null;
};

export type ManagementSessionScore = {
  overallScore: number;
  actions: readonly ManagementActionScore[];
};

export type Exercise = {
  id: string;
  version: number;
  title: string;
  prompt: string;
  timeframe: ExerciseTimeframe;
  source: ExerciseSource;
  candles: readonly Candle[];
  decisionIndex: number;
  revealCount: number;
  skills: readonly ExerciseSkillWeight[];
  rubric: ExerciseRubric;
  tradePlanRubrics: Record<DirectionalDecision, TradePlanRubric>;
  managementRubrics: Record<DirectionalDecision, ExerciseManagementRubric>;
};

export type ExerciseAttemptInput = {
  decision: TrainingDecision;
  confidence: number;
};

export type SkillScore = {
  skill: TrainingSkill;
  score: number;
  weight: number;
};

export type AttemptRating = "strong" | "acceptable" | "weak";

export type ExerciseAttemptResult = {
  exerciseId: string;
  exerciseVersion: number;
  rubricVersion: ExerciseRubric["version"];
  decision: TrainingDecision;
  confidence: number;
  overallScore: number;
  rating: AttemptRating;
  isTopRatedDecision: boolean;
  skillScores: readonly SkillScore[];
  summary: string;
  reasons: readonly string[];
};
