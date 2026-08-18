import { describe, expect, it } from "vitest";

import { DEMO_EXERCISES } from "./exercises/demo-exercises";
import { scoreExerciseAttempt } from "./scoring";
import type { Exercise } from "./types";

function getExercise(id: string) {
  const exercise = DEMO_EXERCISES.find((item) => item.id === id);

  if (!exercise) {
    throw new Error(`Missing demo exercise ${id}.`);
  }

  return exercise;
}

describe("training demo exercises", () => {
  it("keeps every decision point and reveal window inside its candle data", () => {
    for (const exercise of DEMO_EXERCISES) {
      expect(exercise.decisionIndex).toBeGreaterThanOrEqual(0);
      expect(exercise.revealCount).toBeGreaterThan(0);
      expect(exercise.decisionIndex + exercise.revealCount).toBeLessThan(
        exercise.candles.length,
      );
    }
  });

  it("uses valid OHLC candles", () => {
    for (const exercise of DEMO_EXERCISES) {
      for (const candle of exercise.candles) {
        expect(candle.high).toBeGreaterThanOrEqual(
          Math.max(candle.open, candle.close),
        );
        expect(candle.low).toBeLessThanOrEqual(
          Math.min(candle.open, candle.close),
        );
        expect(candle.high).toBeGreaterThan(candle.low);
      }
    }
  });
});

describe("scoreExerciseAttempt", () => {
  it("rates short highest in the clear downtrend scenario", () => {
    const exercise = getExercise("trend-continuation-001");
    const result = scoreExerciseAttempt(exercise, {
      decision: "short",
      confidence: 76,
    });

    expect(result.overallScore).toBe(90);
    expect(result.rating).toBe("strong");
    expect(result.isTopRatedDecision).toBe(true);
  });

  it("rates no trade highest in the midpoint range scenario", () => {
    const exercise = getExercise("range-midpoint-001");
    const result = scoreExerciseAttempt(exercise, {
      decision: "no_trade",
      confidence: 81,
    });

    expect(result.overallScore).toBe(96);
    expect(result.rating).toBe("strong");
    expect(result.isTopRatedDecision).toBe(true);
  });

  it("allows a defensible decision to be acceptable without being top rated", () => {
    const exercise = getExercise("false-breakout-001");
    const result = scoreExerciseAttempt(exercise, {
      decision: "short",
      confidence: 68,
    });

    expect(result.overallScore).toBe(72);
    expect(result.rating).toBe("acceptable");
    expect(result.isTopRatedDecision).toBe(false);
  });

  it("does not change decision quality when confidence changes", () => {
    const exercise = getExercise("range-midpoint-001");
    const lowerConfidence = scoreExerciseAttempt(exercise, {
      decision: "no_trade",
      confidence: 55,
    });
    const higherConfidence = scoreExerciseAttempt(exercise, {
      decision: "no_trade",
      confidence: 98,
    });

    expect(lowerConfidence.overallScore).toBe(higherConfidence.overallScore);
    expect(lowerConfidence.skillScores).toEqual(higherConfidence.skillScores);
    expect(lowerConfidence.confidence).toBe(55);
    expect(higherConfidence.confidence).toBe(98);
  });

  it("does not use revealed future candles to calculate the score", () => {
    const exercise = getExercise("trend-continuation-001");
    const alteredExercise: Exercise = {
      ...exercise,
      candles: exercise.candles.map((candle, index) =>
        index > exercise.decisionIndex
          ? {
              ...candle,
              open: candle.open + 500,
              high: candle.high + 500,
              low: candle.low + 500,
              close: candle.close + 500,
            }
          : candle,
      ),
    };

    const original = scoreExerciseAttempt(exercise, {
      decision: "short",
      confidence: 75,
    });
    const altered = scoreExerciseAttempt(alteredExercise, {
      decision: "short",
      confidence: 75,
    });

    expect(altered.overallScore).toBe(original.overallScore);
    expect(altered.skillScores).toEqual(original.skillScores);
  });

  it("rejects confidence outside the V1 range", () => {
    const exercise = getExercise("range-midpoint-001");

    expect(() =>
      scoreExerciseAttempt(exercise, {
        decision: "no_trade",
        confidence: 49,
      }),
    ).toThrow(RangeError);

    expect(() =>
      scoreExerciseAttempt(exercise, {
        decision: "no_trade",
        confidence: 101,
      }),
    ).toThrow(RangeError);
  });

  it("fails loudly when an exercise rubric omits a scored skill", () => {
    const exercise = getExercise("range-midpoint-001");
    const invalidExercise: Exercise = {
      ...exercise,
      rubric: {
        ...exercise.rubric,
        decisions: {
          ...exercise.rubric.decisions,
          no_trade: {
            ...exercise.rubric.decisions.no_trade,
            skillScores: {
              range_reading: 90,
            },
          },
        },
      },
    };

    expect(() =>
      scoreExerciseAttempt(invalidExercise, {
        decision: "no_trade",
        confidence: 80,
      }),
    ).toThrow("Missing rubric score");
  });
});
