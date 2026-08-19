import { createSyntheticDecisionStageExercise } from "./exercises/synthetic-catalog";
import { scoreExerciseAttempt } from "./scoring";
import type {
  DirectionalDecision,
  Exercise,
  TrainingDecision,
} from "./types";

export const MAX_DECISION_WAIT_CANDLES = 3;
export const MIN_REVEAL_CANDLES_AFTER_DECISION = 8;

export type DecisionWaitEvaluation = {
  beforeWaitOffset: number;
  score: number;
  summary: string;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function isDirectionalDecision(
  decision: TrainingDecision,
): decision is DirectionalDecision {
  return decision === "long" || decision === "short";
}

export function getDecisionWaitLimit(exercise: Exercise) {
  const generation = exercise.source.generation;

  if (
    generation?.generator !== "procedural" ||
    generation.generatorVersion !== 2
  ) {
    return 0;
  }

  return Math.min(
    MAX_DECISION_WAIT_CANDLES,
    Math.max(0, exercise.revealCount - MIN_REVEAL_CANDLES_AFTER_DECISION),
  );
}

export function createDecisionStageExercise(
  exercise: Exercise,
  waitCount: number,
): Exercise {
  if (
    !Number.isInteger(waitCount) ||
    waitCount < 0 ||
    waitCount > getDecisionWaitLimit(exercise)
  ) {
    throw new Error("La espera enviada no es válida para este escenario.");
  }

  if (waitCount === 0) {
    return exercise;
  }

  const stageExercise = createSyntheticDecisionStageExercise(exercise, waitCount);

  if (!stageExercise) {
    throw new Error("Este escenario no admite una decisión diferida.");
  }

  return stageExercise;
}

function getDecisionScores(exercise: Exercise) {
  return {
    long: scoreExerciseAttempt(exercise, {
      decision: "long",
      confidence: 70,
    }).overallScore,
    no_trade: scoreExerciseAttempt(exercise, {
      decision: "no_trade",
      confidence: 70,
    }).overallScore,
    short: scoreExerciseAttempt(exercise, {
      decision: "short",
      confidence: 70,
    }).overallScore,
  };
}

export function scoreDecisionWait(
  exercise: Exercise,
  beforeWaitOffset: number,
): DecisionWaitEvaluation {
  if (
    !Number.isInteger(beforeWaitOffset) ||
    beforeWaitOffset < 0 ||
    beforeWaitOffset >= getDecisionWaitLimit(exercise)
  ) {
    throw new Error("La espera no cabe dentro de este escenario.");
  }

  const stageExercise = createDecisionStageExercise(exercise, beforeWaitOffset);
  const scores = getDecisionScores(stageExercise);
  const bestDirectional = Math.max(scores.long, scores.short);
  const noTradeAdvantage = scores.no_trade - bestDirectional;
  const directionalAdvantage = bestDirectional - scores.no_trade;

  if (noTradeAdvantage >= 0) {
    const score = clamp(
      Math.round(90 + Math.min(noTradeAdvantage, 24) * 0.34),
      90,
      98,
    );

    return {
      beforeWaitOffset,
      score,
      summary:
        "Esperar una vela conserva opcionalidad porque todavía no hay una ventaja direccional superior a mantenerse fuera.",
    };
  }

  if (directionalAdvantage <= 8) {
    return {
      beforeWaitOffset,
      score: 86,
      summary:
        "Esperar sigue siendo razonable: existe una ligera ventaja direccional, pero la confirmación adicional todavía puede aportar valor.",
    };
  }

  if (directionalAdvantage <= 20) {
    return {
      beforeWaitOffset,
      score: 74,
      summary:
        "Esperar es defendible, aunque retrasa una oportunidad que ya empieza a mostrar una dirección mejor respaldada.",
    };
  }

  return {
    beforeWaitOffset,
    score: clamp(Math.round(78 - directionalAdvantage * 0.72), 52, 68),
    summary:
      "Esperar añade confirmación, pero el contexto ya ofrecía una oportunidad direccional suficientemente clara y el retraso penaliza el timing.",
  };
}

export function evaluateDecisionWaits(
  exercise: Exercise,
  waitCount: number,
): readonly DecisionWaitEvaluation[] {
  createDecisionStageExercise(exercise, waitCount);

  return Array.from({ length: waitCount }, (_, index) =>
    scoreDecisionWait(exercise, index),
  );
}

export function calculateAttemptTimingScore(options: {
  exercise: Exercise;
  waitCount: number;
  finalDecision: TrainingDecision;
  entryScore: number | null;
}) {
  const waitEvaluations = evaluateDecisionWaits(
    options.exercise,
    options.waitCount,
  );
  const observations = waitEvaluations.map((evaluation) => evaluation.score);

  if (isDirectionalDecision(options.finalDecision)) {
    if (options.entryScore === null) {
      throw new Error("Una decisión direccional necesita score de entrada para Timing.");
    }

    observations.push(options.entryScore);
  }

  if (observations.length === 0) {
    return null;
  }

  return Math.round(
    observations.reduce((total, score) => total + score, 0) /
      observations.length,
  );
}
