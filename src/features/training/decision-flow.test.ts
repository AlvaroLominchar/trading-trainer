import { describe, expect, it } from "vitest";

import {
  calculateAttemptTimingScore,
  createDecisionStageExercise,
  evaluateDecisionWaits,
  getDecisionWaitLimit,
  scoreDecisionWait,
} from "./decision-flow";
import {
  generateSyntheticExercise,
  SYNTHETIC_ARCHETYPES,
  validateSyntheticExercise,
} from "./exercises/synthetic-catalog";
import { scoreExerciseAttempt } from "./scoring";

function findCompressionWithDirectionalStage() {
  for (let seed = 1; seed <= 400; seed += 1) {
    const exercise = generateSyntheticExercise("compression", seed);
    const stage = createDecisionStageExercise(exercise, 3);
    const longScore = scoreExerciseAttempt(stage, {
      decision: "long",
      confidence: 70,
    }).overallScore;
    const shortScore = scoreExerciseAttempt(stage, {
      decision: "short",
      confidence: 70,
    }).overallScore;

    if (Math.max(longScore, shortScore) >= 85) {
      return { exercise, stage, longScore, shortScore };
    }
  }

  throw new Error("No se encontró una compresión de prueba con resolución visible.");
}

describe("decision flow", () => {
  it("permite hasta tres velas de espera sin comerse la ventana mínima de gestión", () => {
    const exercise = generateSyntheticExercise("compression", 4242);

    expect(getDecisionWaitLimit(exercise)).toBe(3);
    expect(createDecisionStageExercise(exercise, 3).revealCount).toBe(9);
    expect(createDecisionStageExercise(exercise, 3).decisionIndex).toBe(
      exercise.decisionIndex + 3,
    );
  });

  it("reconstruye el plan desde la nueva información visible", () => {
    const exercise = generateSyntheticExercise("trend-continuation", 9123);
    const stage = createDecisionStageExercise(exercise, 2);
    const latestVisibleClose = stage.candles[stage.decisionIndex].close;

    expect(stage.tradePlanRubrics.long.entry.optimal.min).toBeLessThanOrEqual(
      latestVisibleClose,
    );
    expect(stage.tradePlanRubrics.long.entry.optimal.max).toBeGreaterThanOrEqual(
      latestVisibleClose,
    );
    expect(stage.rubric.version).toBe(2);
  });

  it("premia esperar cuando no operar es todavía mejor que forzar dirección", () => {
    const exercise = generateSyntheticExercise("compression", 4242);
    const evaluation = scoreDecisionWait(exercise, 0);

    expect(evaluation.score).toBeGreaterThanOrEqual(90);
  });

  it("penaliza esperar de más cuando ya existe una dirección claramente superior", () => {
    const exercise = generateSyntheticExercise("trend-continuation", 9123);
    const evaluation = scoreDecisionWait(exercise, 0);

    expect(evaluation.score).toBeLessThan(75);
  });

  it("permite que una compresión pase de esperar a una decisión direccional tras confirmación", () => {
    const { stage, longScore, shortScore } = findCompressionWithDirectionalStage();
    const noTradeScore = scoreExerciseAttempt(stage, {
      decision: "no_trade",
      confidence: 70,
    }).overallScore;

    expect(Math.max(longScore, shortScore)).toBeGreaterThan(noTradeScore);
    expect(Math.max(longScore, shortScore)).toBeGreaterThanOrEqual(85);
  });

  it("mantiene válidos los stages de espera en un corpus de todas las familias", () => {
    for (const archetype of SYNTHETIC_ARCHETYPES) {
      for (let seed = 1; seed <= 40; seed += 1) {
        const exercise = generateSyntheticExercise(archetype, seed);

        for (let waitCount = 1; waitCount <= getDecisionWaitLimit(exercise); waitCount += 1) {
          const stage = createDecisionStageExercise(exercise, waitCount);

          expect(validateSyntheticExercise(stage).valid).toBe(true);
          expect(stage.decisionIndex).toBe(exercise.decisionIndex + waitCount);
          expect(stage.revealCount).toBe(exercise.revealCount - waitCount);
        }
      }
    }
  });

  it("Timing promedia cada decisión temporal una sola vez", () => {
    const exercise = generateSyntheticExercise("compression", 4242);
    const waits = evaluateDecisionWaits(exercise, 2);
    const entryScore = 80;
    const expected = Math.round(
      (waits[0].score + waits[1].score + entryScore) / 3,
    );

    expect(
      calculateAttemptTimingScore({
        exercise,
        waitCount: 2,
        finalDecision: "long",
        entryScore,
      }),
    ).toBe(expected);
  });

  it("un no trade después de esperar aporta evidencia de Timing sin inventar Plan", () => {
    const exercise = generateSyntheticExercise("range-midpoint", 2301);

    expect(
      calculateAttemptTimingScore({
        exercise,
        waitCount: 2,
        finalDecision: "no_trade",
        entryScore: null,
      }),
    ).toBeGreaterThanOrEqual(90);
    expect(
      calculateAttemptTimingScore({
        exercise,
        waitCount: 0,
        finalDecision: "no_trade",
        entryScore: null,
      }),
    ).toBeNull();
  });
});
