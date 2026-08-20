import { scoreExerciseAttempt } from "./scoring";
import type { Exercise, TrainingDecision } from "./types";

export const EXERCISE_DIFFICULTY_RUBRIC_VERSION = 1;

export const EXERCISE_DIFFICULTIES = ["easy", "medium", "hard"] as const;

export type ExerciseDifficulty = (typeof EXERCISE_DIFFICULTIES)[number];

export type ExerciseDifficultyAssessment = {
  version: typeof EXERCISE_DIFFICULTY_RUBRIC_VERSION;
  level: ExerciseDifficulty;
  score: number;
  signals: {
    decisionMargin: number;
    decisionAmbiguity: number;
    structuralComplexity: number;
    microstructureNoise: number;
  };
};

const DIFFICULTY_LABELS: Record<ExerciseDifficulty, string> = {
  easy: "Fácil",
  medium: "Intermedia",
  hard: "Difícil",
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizeSignal(
  value: number,
  easyBoundary: number,
  hardBoundary: number,
) {
  if (hardBoundary <= easyBoundary) {
    throw new Error("Los límites de dificultad deben estar ordenados.");
  }

  return clamp(
    ((value - easyBoundary) / (hardBoundary - easyBoundary)) * 100,
    0,
    100,
  );
}

function getDecisionScores(exercise: Exercise) {
  return (["long", "no_trade", "short"] as const)
    .map((decision: TrainingDecision) =>
      scoreExerciseAttempt(exercise, {
        decision,
        confidence: 75,
      }).overallScore,
    )
    .sort((first, second) => second - first);
}

function getDecisionAmbiguity(exercise: Exercise) {
  const [bestScore, secondBestScore] = getDecisionScores(exercise);
  const decisionMargin = bestScore - secondBestScore;

  // Un margen amplio entre la mejor decisión y la segunda hace el ejercicio
  // más legible. Un margen estrecho exige discriminar alternativas defendibles.
  const decisionAmbiguity = clamp(
    ((52 - decisionMargin) / (52 - 8)) * 100,
    0,
    100,
  );

  return {
    decisionMargin,
    decisionAmbiguity,
  };
}

function getVisibleStructureSignals(exercise: Exercise) {
  const visibleCandles = exercise.candles.slice(0, exercise.decisionIndex + 1);
  const closes = visibleCandles.map((candle) => candle.close);

  if (visibleCandles.length < 2) {
    throw new Error("La dificultad necesita al menos dos velas visibles.");
  }

  const closeRange = Math.max(...closes) - Math.min(...closes);
  const totalCloseMovement = closes
    .slice(1)
    .reduce(
      (total, close, index) => total + Math.abs(close - closes[index]),
      0,
    );
  const pathRatio =
    totalCloseMovement / Math.max(closeRange, Number.EPSILON);

  // Un recorrido que cruza muchas veces el mismo rango visible exige separar
  // estructura de ruido. La señal se satura para no premiar extremos absurdos.
  const structuralComplexity = normalizeSignal(pathRatio, 1.8, 6.6);

  const wickShare =
    visibleCandles.reduce((total, candle) => {
      const range = Math.max(candle.high - candle.low, Number.EPSILON);
      const body = Math.abs(candle.close - candle.open);
      return total + clamp((range - body) / range, 0, 1);
    }, 0) / visibleCandles.length;

  // Más proporción de mechas implica más rechazo/microestructura alrededor de
  // los cierres y, por tanto, una lectura visual algo menos limpia.
  const microstructureNoise = normalizeSignal(wickShare, 0.52, 0.68);

  return {
    structuralComplexity,
    microstructureNoise,
  };
}

export function getExerciseDifficultyLevel(
  score: number,
): ExerciseDifficulty {
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new RangeError("La dificultad debe estar entre 0 y 100.");
  }

  if (score <= 37) {
    return "easy";
  }

  if (score <= 65) {
    return "medium";
  }

  return "hard";
}

export function getExerciseDifficultyLabel(
  difficulty: ExerciseDifficulty,
) {
  return DIFFICULTY_LABELS[difficulty];
}

export function assessExerciseDifficulty(
  exercise: Exercise,
): ExerciseDifficultyAssessment {
  const { decisionMargin, decisionAmbiguity } =
    getDecisionAmbiguity(exercise);
  const { structuralComplexity, microstructureNoise } =
    getVisibleStructureSignals(exercise);

  const score = Math.round(
    decisionAmbiguity * 0.55 +
      structuralComplexity * 0.3 +
      microstructureNoise * 0.15,
  );

  return {
    version: EXERCISE_DIFFICULTY_RUBRIC_VERSION,
    level: getExerciseDifficultyLevel(score),
    score,
    signals: {
      decisionMargin,
      decisionAmbiguity: Math.round(decisionAmbiguity),
      structuralComplexity: Math.round(structuralComplexity),
      microstructureNoise: Math.round(microstructureNoise),
    },
  };
}
