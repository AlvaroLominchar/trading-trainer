import { describe, expect, it } from "vitest";

import { DEMO_EXERCISES } from "./exercises/demo-exercises";
import {
  calculateRewardRisk,
  isTradePlanGeometryValid,
  scorePriceZone,
  scoreRewardRisk,
  scoreTradePlan,
} from "./trade-plan-scoring";

function getExercise(id: string) {
  const exercise = DEMO_EXERCISES.find((item) => item.id === id);

  if (!exercise) {
    throw new Error(`Missing demo exercise ${id}.`);
  }

  return exercise;
}

describe("trade plan geometry", () => {
  it("accepts correctly ordered long and short plans", () => {
    expect(
      isTradePlanGeometryValid("long", {
        entry: 100,
        stop: 98,
        target: 104,
      }),
    ).toBe(true);

    expect(
      isTradePlanGeometryValid("short", {
        entry: 100,
        stop: 102,
        target: 96,
      }),
    ).toBe(true);
  });

  it("rejects crossed or zero-risk plans", () => {
    expect(
      isTradePlanGeometryValid("long", {
        entry: 100,
        stop: 101,
        target: 104,
      }),
    ).toBe(false);

    expect(
      isTradePlanGeometryValid("short", {
        entry: 100,
        stop: 100,
        target: 96,
      }),
    ).toBe(false);
  });
});

describe("trade plan component scoring", () => {
  it("scores the optimal price zone at 100", () => {
    expect(
      scorePriceZone(100, {
        optimal: { min: 99.5, max: 100.5 },
        acceptable: { min: 99, max: 101 },
      }),
    ).toBe(100);
  });

  it("degrades smoothly inside and outside the acceptable zone", () => {
    const rubric = {
      optimal: { min: 100, max: 101 },
      acceptable: { min: 99, max: 102 },
    } as const;

    expect(scorePriceZone(99.5, rubric)).toBe(80);
    expect(scorePriceZone(98.5, rubric)).toBe(30);
    expect(scorePriceZone(97.5, rubric)).toBe(0);
  });

  it("calculates reward/risk independently of direction", () => {
    expect(
      calculateRewardRisk("long", {
        entry: 100,
        stop: 98,
        target: 104,
      }),
    ).toBe(2);

    expect(
      calculateRewardRisk("short", {
        entry: 100,
        stop: 102,
        target: 96,
      }),
    ).toBe(2);
  });

  it("rewards reward/risk progressively without making it unbounded", () => {
    expect(scoreRewardRisk(0.75, 1.5, 2.5)).toBe(30);
    expect(scoreRewardRisk(1.5, 1.5, 2.5)).toBe(60);
    expect(scoreRewardRisk(2, 1.5, 2.5)).toBe(80);
    expect(scoreRewardRisk(4, 1.5, 2.5)).toBe(100);
  });
});

describe("scoreTradePlan", () => {
  it("rates a well-constructed short plan strongly in the downtrend exercise", () => {
    const exercise = getExercise("trend-continuation-001");
    const result = scoreTradePlan(exercise, "short", {
      entry: 85.9,
      stop: 87.2,
      target: 83.4,
    });

    expect(result.rewardRisk).toBeCloseTo(1.9230769231, 8);
    expect(result.overallScore).toBeGreaterThanOrEqual(85);
    expect(result.componentScores).toHaveLength(4);
  });

  it("can score a structurally coherent plan even when the directional decision itself is weak", () => {
    const exercise = getExercise("range-midpoint-001");
    const result = scoreTradePlan(exercise, "long", {
      entry: 99.7,
      stop: 98.5,
      target: 101.6,
    });

    expect(result.overallScore).toBeGreaterThanOrEqual(80);
  });

  it("rejects invalid plan geometry before scoring", () => {
    const exercise = getExercise("false-breakout-001");

    expect(() =>
      scoreTradePlan(exercise, "short", {
        entry: 101,
        stop: 100,
        target: 99,
      }),
    ).toThrow(RangeError);
  });
});
