export const TRAINING_DECISIONS = ["long", "no_trade", "short"] as const;

export type TrainingDecision = (typeof TRAINING_DECISIONS)[number];

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
