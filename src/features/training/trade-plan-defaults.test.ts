import { describe, expect, it } from "vitest";

import { DEMO_EXERCISES } from "./exercises/demo-exercises";
import { createNeutralTradePlan } from "./trade-plan-defaults";
import {
  calculateRewardRisk,
  isTradePlanGeometryValid,
  scoreTradePlan,
} from "./trade-plan-scoring";

function cloneWithDifferentFuture(exercise: (typeof DEMO_EXERCISES)[number]) {
  return {
    ...exercise,
    candles: exercise.candles.map((candle, index) =>
      index <= exercise.decisionIndex
        ? candle
        : {
            ...candle,
            open: candle.open + 500,
            high: candle.high + 500,
            low: candle.low + 500,
            close: candle.close + 500,
          },
    ),
  };
}

describe("createNeutralTradePlan", () => {
  it("creates valid long and short geometry for every demo exercise", () => {
    for (const exercise of DEMO_EXERCISES) {
      for (const decision of ["long", "short"] as const) {
        expect(
          isTradePlanGeometryValid(
            decision,
            createNeutralTradePlan(exercise, decision),
          ),
        ).toBe(true);
      }
    }
  });

  it("starts from a neutral 1.25 reward/risk instead of an exercise rubric target", () => {
    for (const exercise of DEMO_EXERCISES) {
      for (const decision of ["long", "short"] as const) {
        expect(
          calculateRewardRisk(
            decision,
            createNeutralTradePlan(exercise, decision),
          ),
        ).toBeCloseTo(1.25, 3);
      }
    }
  });

  it("does not use hidden future candles to construct the initial plan", () => {
    for (const exercise of DEMO_EXERCISES) {
      const changedFuture = cloneWithDifferentFuture(exercise);

      expect(createNeutralTradePlan(changedFuture, "long")).toEqual(
        createNeutralTradePlan(exercise, "long"),
      );
      expect(createNeutralTradePlan(changedFuture, "short")).toEqual(
        createNeutralTradePlan(exercise, "short"),
      );
    }
  });

  it("does not accidentally hand the user a strong pre-scored plan in demo scenarios", () => {
    for (const exercise of DEMO_EXERCISES) {
      for (const decision of ["long", "short"] as const) {
        const result = scoreTradePlan(
          exercise,
          decision,
          createNeutralTradePlan(exercise, decision),
        );

        expect(result.overallScore).toBeLessThan(80);
      }
    }
  });
});
