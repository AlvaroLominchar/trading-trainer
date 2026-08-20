import { describe, expect, it } from "vitest";

import { generateSyntheticExercise, SYNTHETIC_ARCHETYPES } from "./exercises/synthetic-catalog";
import {
  assessExerciseDifficulty,
  EXERCISE_DIFFICULTY_RUBRIC_VERSION,
  getExerciseDifficultyLabel,
  getExerciseDifficultyLevel,
} from "./difficulty";

describe("exercise difficulty rubric", () => {
  it("clasifica ejemplos estables de fácil, intermedio y difícil", () => {
    expect(
      assessExerciseDifficulty(
        generateSyntheticExercise("compression", 1),
      ).level,
    ).toBe("easy");
    expect(
      assessExerciseDifficulty(
        generateSyntheticExercise("trend-continuation", 1),
      ).level,
    ).toBe("medium");
    expect(
      assessExerciseDifficulty(
        generateSyntheticExercise("range-extreme", 1),
      ).level,
    ).toBe("hard");
  });

  it("mantiene la dificultad determinista para el mismo escenario", () => {
    const first = assessExerciseDifficulty(
      generateSyntheticExercise("false-breakout", 31415),
    );
    const second = assessExerciseDifficulty(
      generateSyntheticExercise("false-breakout", 31415),
    );

    expect(first).toEqual(second);
    expect(first.version).toBe(EXERCISE_DIFFICULTY_RUBRIC_VERSION);
  });

  it("usa solo información visible y no depende del futuro revelado", () => {
    const exercise = generateSyntheticExercise("level-retest", 27182);
    const baseline = assessExerciseDifficulty(exercise);
    const candles = exercise.candles.map((candle, index) =>
      index <= exercise.decisionIndex
        ? candle
        : {
            ...candle,
            open: candle.open * 1.8,
            high: candle.high * 2.1,
            low: candle.low * 0.35,
            close: candle.close * 1.9,
          },
    );

    expect(
      assessExerciseDifficulty({
        ...exercise,
        candles,
      }),
    ).toEqual(baseline);
  });

  it("no muta el ejercicio al evaluarlo", () => {
    const exercise = generateSyntheticExercise("breakout-acceptance", 16180);
    const before = JSON.stringify(exercise);

    assessExerciseDifficulty(exercise);

    expect(JSON.stringify(exercise)).toBe(before);
  });

  it("mantiene score y señales dentro de sus rangos", () => {
    for (const archetype of SYNTHETIC_ARCHETYPES) {
      for (const seed of [1, 7, 29, 113, 997]) {
        const assessment = assessExerciseDifficulty(
          generateSyntheticExercise(archetype, seed),
        );

        expect(assessment.score).toBeGreaterThanOrEqual(0);
        expect(assessment.score).toBeLessThanOrEqual(100);
        expect(assessment.signals.decisionMargin).toBeGreaterThanOrEqual(0);
        expect(assessment.signals.decisionAmbiguity).toBeGreaterThanOrEqual(0);
        expect(assessment.signals.decisionAmbiguity).toBeLessThanOrEqual(100);
        expect(assessment.signals.structuralComplexity).toBeGreaterThanOrEqual(0);
        expect(assessment.signals.structuralComplexity).toBeLessThanOrEqual(100);
        expect(assessment.signals.microstructureNoise).toBeGreaterThanOrEqual(0);
        expect(assessment.signals.microstructureNoise).toBeLessThanOrEqual(100);
      }
    }
  });

  it("mantiene las tres bandas presentes en un corpus procedural amplio", () => {
    const counts = {
      easy: 0,
      medium: 0,
      hard: 0,
    };

    for (const archetype of SYNTHETIC_ARCHETYPES) {
      for (let seed = 1; seed <= 100; seed += 1) {
        counts[
          assessExerciseDifficulty(
            generateSyntheticExercise(archetype, seed),
          ).level
        ] += 1;
      }
    }

    expect(counts.easy).toBeGreaterThan(120);
    expect(counts.medium).toBeGreaterThan(120);
    expect(counts.hard).toBeGreaterThan(120);
  });

  it("expone límites y etiquetas visibles estables", () => {
    expect(getExerciseDifficultyLevel(0)).toBe("easy");
    expect(getExerciseDifficultyLevel(37)).toBe("easy");
    expect(getExerciseDifficultyLevel(38)).toBe("medium");
    expect(getExerciseDifficultyLevel(65)).toBe("medium");
    expect(getExerciseDifficultyLevel(66)).toBe("hard");
    expect(getExerciseDifficultyLevel(100)).toBe("hard");

    expect(getExerciseDifficultyLabel("easy")).toBe("Fácil");
    expect(getExerciseDifficultyLabel("medium")).toBe("Intermedia");
    expect(getExerciseDifficultyLabel("hard")).toBe("Difícil");
  });
});
