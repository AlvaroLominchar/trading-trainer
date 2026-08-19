import { describe, expect, it } from "vitest";

import { scoreExerciseAttempt } from "../scoring";
import {
  isTradePlanGeometryValid,
  scoreTradePlan,
} from "../trade-plan-scoring";
import type {
  Exercise,
  PriceZone,
  SyntheticExerciseArchetype,
  TrainingDecision,
} from "../types";
import {
  createSyntheticExerciseId,
  generateSyntheticExercise,
  parseSyntheticExerciseId,
  resolveTrainingExercise,
  selectSyntheticExercise,
  SYNTHETIC_ARCHETYPES,
  SYNTHETIC_GENERATOR_VERSION,
  validateSyntheticExercise,
} from "./synthetic-catalog";

function midpoint(zone: PriceZone) {
  return Number(((zone.min + zone.max) / 2).toFixed(2));
}

function normalizedVisibleSignature(exercise: Exercise, points = 48) {
  const closes = exercise.candles
    .slice(0, exercise.decisionIndex + 1)
    .map((candle) => candle.close);
  const minimum = Math.min(...closes);
  const maximum = Math.max(...closes);
  const range = Math.max(maximum - minimum, 0.000001);

  return Array.from({ length: points }, (_, index) => {
    const cursor = (index * (closes.length - 1)) / (points - 1);
    const left = Math.floor(cursor);
    const right = Math.min(Math.ceil(cursor), closes.length - 1);
    const fraction = cursor - left;
    const interpolated =
      closes[left] * (1 - fraction) + closes[right] * fraction;

    return (interpolated - minimum) / range;
  });
}

function meanAbsoluteDifference(first: readonly number[], second: readonly number[]) {
  return (
    first.reduce(
      (total, value, index) => total + Math.abs(value - second[index]),
      0,
    ) / first.length
  );
}

function getDecisionScore(exercise: Exercise, decision: TrainingDecision) {
  return scoreExerciseAttempt(exercise, {
    decision,
    confidence: 75,
  }).overallScore;
}

function getGeneration(exercise: Exercise) {
  const generation = exercise.source.generation;

  if (!generation) {
    throw new Error(`Exercise ${exercise.id} is missing generation metadata.`);
  }

  return generation;
}

function getPairwiseShapeDistances(
  archetype: SyntheticExerciseArchetype,
  seeds: readonly number[],
) {
  const signatures = seeds.map((seed) =>
    normalizedVisibleSignature(generateSyntheticExercise(archetype, seed)),
  );
  const distances: number[] = [];

  for (let first = 0; first < signatures.length; first += 1) {
    for (let second = first + 1; second < signatures.length; second += 1) {
      distances.push(
        meanAbsoluteDifference(signatures[first], signatures[second]),
      );
    }
  }

  return distances;
}

describe("synthetic exercise generator v2", () => {
  it("reproduce exactamente el mismo escenario para la misma seed", () => {
    const first = generateSyntheticExercise("trend-continuation", 42);
    const second = generateSyntheticExercise("trend-continuation", 42);

    expect(first).toEqual(second);
    expect(first.id).toBe("syn-trend-continuation-g2-s42");
    expect(first.version).toBe(SYNTHETIC_GENERATOR_VERSION);
    expect(first.source.generation).toEqual(
      expect.objectContaining({
        generator: "procedural",
        generatorVersion: SYNTHETIC_GENERATOR_VERSION,
        archetype: "trend-continuation",
        seed: 42,
      }),
    );
    expect(first.source.generation?.variant).toBeTypeOf("number");
    expect(["long", "short"]).toContain(first.source.generation?.setupDirection);
  });

  it.each(SYNTHETIC_ARCHETYPES)(
    "genera formas estructuralmente distintas dentro de %s, no simples traslaciones de precio",
    (archetype: SyntheticExerciseArchetype) => {
      const distances = getPairwiseShapeDistances(
        archetype,
        Array.from({ length: 12 }, (_, index) => index + 1),
      );
      const averageDistance =
        distances.reduce((total, distance) => total + distance, 0) /
        distances.length;

      expect(Math.min(...distances)).toBeGreaterThan(0.02);
      expect(averageDistance).toBeGreaterThan(0.18);
    },
  );

  it.each(SYNTHETIC_ARCHETYPES)(
    "supera los invariantes de calidad en un corpus determinista de %s",
    (archetype: SyntheticExerciseArchetype) => {
      for (let seed = 1; seed <= 100; seed += 1) {
        const exercise = generateSyntheticExercise(archetype, seed);
        const diagnostics = validateSyntheticExercise(exercise);

        expect(diagnostics.valid, `${exercise.id}: ${diagnostics.issues.join(" ")}`).toBe(
          true,
        );
        expect(exercise.decisionIndex).toBeGreaterThan(0);
        expect(exercise.decisionIndex + exercise.revealCount).toBeLessThan(
          exercise.candles.length,
        );
        expect(diagnostics.averageTrueRange).toBeGreaterThan(0);
        expect(diagnostics.visibleRange).toBeGreaterThan(
          diagnostics.averageTrueRange * 3,
        );
      }
    },
  );

  it.each(SYNTHETIC_ARCHETYPES)(
    "no revela el arquetipo en el título ni en la fuente de %s",
    (archetype: SyntheticExerciseArchetype) => {
      const exercise = generateSyntheticExercise(archetype, 90421);
      const visibleCopy = `${exercise.title} ${exercise.prompt} ${exercise.source.label}`;

      expect(exercise.source.label).toBe("Escenario sintético");
      expect(visibleCopy.toLowerCase()).not.toMatch(
        /tendencia|rango|ruptura|breakout|alcista|bajista|continuaci[oó]n/,
      );
    },
  );

  it("produce ambos sentidos de tendencia y varias variantes/timeframes", () => {
    const exercises = Array.from({ length: 60 }, (_, index) =>
      generateSyntheticExercise("trend-continuation", index + 1),
    );
    const directions = new Set(
      exercises.map((exercise) => getGeneration(exercise).setupDirection),
    );
    const variants = new Set(
      exercises.map((exercise) => getGeneration(exercise).variant),
    );
    const timeframes = new Set(exercises.map((exercise) => exercise.timeframe));

    expect(directions).toEqual(new Set(["long", "short"]));
    expect(variants.size).toBe(6);
    expect(timeframes).toEqual(new Set(["5m", "15m", "1h"]));
  });

  it("refleja falsas rupturas tanto superiores como inferiores", () => {
    const exercises = Array.from({ length: 60 }, (_, index) =>
      generateSyntheticExercise("false-breakout", index + 1),
    );
    const reversalDirections = new Set(
      exercises.map((exercise) => getGeneration(exercise).setupDirection),
    );

    expect(reversalDirections).toEqual(new Set(["long", "short"]));
  });

  it("mantiene el rango como contexto neutral", () => {
    for (let seed = 1; seed <= 30; seed += 1) {
      expect(
        getGeneration(generateSyntheticExercise("range-midpoint", seed))
          .setupDirection,
      ).toBe("neutral");
    }
  });

  it("hace que la dirección estructural sea la mejor lectura en continuaciones", () => {
    for (let seed = 1; seed <= 30; seed += 1) {
      const exercise = generateSyntheticExercise("trend-continuation", seed);
      const preferred = getGeneration(exercise).setupDirection;

      if (preferred !== "long" && preferred !== "short") {
        throw new Error("Trend continuation must have a directional setup.");
      }

      const preferredResult = scoreExerciseAttempt(exercise, {
        decision: preferred,
        confidence: 75,
      });

      expect(preferredResult.isTopRatedDecision).toBe(true);
      expect(preferredResult.overallScore).toBeGreaterThanOrEqual(85);
    }
  });

  it("premia no operar desde el equilibrio del rango", () => {
    for (let seed = 1; seed <= 24; seed += 1) {
      const exercise = generateSyntheticExercise("range-midpoint", seed);

      expect(getDecisionScore(exercise, "no_trade")).toBeGreaterThan(
        getDecisionScore(exercise, "long"),
      );
      expect(getDecisionScore(exercise, "no_trade")).toBeGreaterThan(
        getDecisionScore(exercise, "short"),
      );
    }
  });

  it("mantiene no operar como opción más robusta tras una falsa ruptura, con reversión defendible", () => {
    for (let seed = 1; seed <= 24; seed += 1) {
      const exercise = generateSyntheticExercise("false-breakout", seed);
      const reversal = getGeneration(exercise).setupDirection;

      if (reversal !== "long" && reversal !== "short") {
        throw new Error("False breakout must expose a reversal direction.");
      }

      const continuation = reversal === "long" ? "short" : "long";
      const waitScore = getDecisionScore(exercise, "no_trade");
      const reversalScore = getDecisionScore(exercise, reversal);
      const continuationScore = getDecisionScore(exercise, continuation);

      expect(waitScore).toBeGreaterThan(reversalScore);
      expect(reversalScore).toBeGreaterThanOrEqual(60);
      expect(continuationScore).toBeLessThan(60);
    }
  });

  it.each(SYNTHETIC_ARCHETYPES)(
    "crea planes operables y bien puntuados para múltiples seeds de %s",
    (archetype: SyntheticExerciseArchetype) => {
      for (let seed = 1; seed <= 16; seed += 1) {
        const exercise = generateSyntheticExercise(archetype, seed);

        for (const decision of ["long", "short"] as const) {
          const rubric = exercise.tradePlanRubrics[decision];
          const plan = {
            entry: midpoint(rubric.entry.optimal),
            stop: midpoint(rubric.stop.optimal),
            target: midpoint(rubric.target.optimal),
          };

          expect(isTradePlanGeometryValid(decision, plan)).toBe(true);
          expect(scoreTradePlan(exercise, decision, plan).overallScore).toBeGreaterThan(
            75,
          );
        }
      }
    },
  );
});

describe("synthetic exercise ids and resolver", () => {
  it("codifica y recupera arquetipo, versión y seed de la generación actual", () => {
    const exerciseId = createSyntheticExerciseId("false-breakout", 4567);

    expect(exerciseId).toBe("syn-false-breakout-g2-s4567");
    expect(parseSyntheticExerciseId(exerciseId)).toEqual({
      archetype: "false-breakout",
      seed: 4567,
      generatorVersion: SYNTHETIC_GENERATOR_VERSION,
    });
  });

  it("rechaza IDs con versiones no soportadas", () => {
    expect(parseSyntheticExerciseId("syn-range-midpoint-g3-s123")).toBeNull();
    expect(parseSyntheticExerciseId("syn-range-midpoint-g2-s0")).toBeNull();
  });

  it("reconstruye exactamente un escenario g2 en servidor", () => {
    const generated = generateSyntheticExercise("trend-continuation", 777);
    const resolved = resolveTrainingExercise(generated.id, generated.version);

    expect(resolved).toEqual(generated);
    expect(resolveTrainingExercise(generated.id, 1)).toBeUndefined();
  });

  it("conserva reconstrucción de g1 y compatibilidad con templates canónicos", () => {
    const legacyId = createSyntheticExerciseId("range-midpoint", 1234, 1);
    const legacy = resolveTrainingExercise(legacyId, 1);

    expect(legacy?.id).toBe(legacyId);
    expect(legacy?.source.generation?.generatorVersion).toBe(1);
    expect(resolveTrainingExercise("trend-continuation-001", 1)?.id).toBe(
      "trend-continuation-001",
    );
  });
});

describe("synthetic exercise selector", () => {
  it("evita repetir el ejercicio actual y su familia de forma inmediata", () => {
    const current = generateSyntheticExercise("trend-continuation", 1001);
    const next = selectSyntheticExercise({
      currentExerciseId: current.id,
      recentExerciseIds: [current.id],
      selectionSeed: 9001,
    });

    expect(next.id).not.toBe(current.id);
    expect(next.source.generation?.archetype).not.toBe("trend-continuation");
    expect(next.version).toBe(SYNTHETIC_GENERATOR_VERSION);
  });

  it("favorece familias menos vistas dentro del historial reciente", () => {
    const recent = [
      createSyntheticExerciseId("trend-continuation", 1),
      createSyntheticExerciseId("trend-continuation", 2),
      createSyntheticExerciseId("range-midpoint", 3),
    ];
    const next = selectSyntheticExercise({
      recentExerciseIds: recent,
      currentExerciseId: recent[2],
      selectionSeed: 12345,
    });

    expect(next.source.generation?.archetype).toBe("false-breakout");
    expect(recent).not.toContain(next.id);
  });

  it("entrega únicamente escenarios v2 que superan el validador", () => {
    let currentExerciseId: string | null = null;
    const recentExerciseIds: string[] = [];

    for (let index = 0; index < 30; index += 1) {
      const next = selectSyntheticExercise({
        recentExerciseIds,
        currentExerciseId,
        selectionSeed: 50_000 + index,
      });

      expect(next.version).toBe(SYNTHETIC_GENERATOR_VERSION);
      expect(validateSyntheticExercise(next).valid).toBe(true);
      expect(recentExerciseIds).not.toContain(next.id);

      recentExerciseIds.unshift(next.id);
      currentExerciseId = next.id;
    }
  });
});
