import { describe, expect, it } from "vitest";

import { DEMO_EXERCISES } from "./exercises/demo-exercises";
import {
  applyManagedStop,
  calculateProtectedRiskR,
  createManagementPosition,
  evaluateManagementCandle,
  getManagementCandle,
  getManagementCheckpoints,
  isManagedStopValid,
  scoreManagementAction,
  scoreManagementSession,
} from "./management";
import type { Candle, Exercise, ManagementPositionState } from "./types";

function getExercise(id: string) {
  const exercise = DEMO_EXERCISES.find((item) => item.id === id);

  if (!exercise) {
    throw new Error(`Missing demo exercise ${id}.`);
  }

  return exercise;
}

function getTrendShortPosition(): ManagementPositionState {
  return createManagementPosition({
    entry: 85.8,
    stop: 87.2,
    target: 83.4,
  });
}

describe("management checkpoints", () => {
  it("keeps every demo checkpoint ordered and inside the reveal window", () => {
    for (const exercise of DEMO_EXERCISES) {
      for (const decision of ["long", "short"] as const) {
        const checkpoints = getManagementCheckpoints(exercise, decision);
        const offsets = checkpoints.map((checkpoint) => checkpoint.afterRevealOffset);

        expect(offsets).toEqual([...offsets].sort((a, b) => a - b));
        expect(new Set(offsets).size).toBe(offsets.length);

        for (const offset of offsets) {
          expect(offset).toBeGreaterThanOrEqual(1);
          expect(offset).toBeLessThanOrEqual(exercise.revealCount);
        }
      }
    }
  });

  it("returns the candle visible at a management offset", () => {
    const exercise = getExercise("trend-continuation-001");
    const candle = getManagementCandle(exercise, 2);

    expect(candle).toBe(exercise.candles[exercise.decisionIndex + 2]);
    expect(candle.close).toBe(85);
  });
});

describe("management lifecycle", () => {
  const longPosition = createManagementPosition({
    entry: 100,
    stop: 95,
    target: 110,
  });
  const shortPosition = createManagementPosition({
    entry: 100,
    stop: 105,
    target: 90,
  });

  it("detects stop and target hits for both directions", () => {
    const longStop: Candle = {
      timestamp: 1,
      open: 100,
      high: 104,
      low: 94,
      close: 98,
    };
    const longTarget: Candle = {
      timestamp: 2,
      open: 100,
      high: 111,
      low: 99,
      close: 108,
    };
    const shortStop: Candle = {
      timestamp: 3,
      open: 100,
      high: 106,
      low: 96,
      close: 103,
    };
    const shortTarget: Candle = {
      timestamp: 4,
      open: 100,
      high: 102,
      low: 89,
      close: 92,
    };

    expect(evaluateManagementCandle("long", longPosition, longStop)).toEqual({
      status: "stop_hit",
      exitPrice: 95,
    });
    expect(evaluateManagementCandle("long", longPosition, longTarget)).toEqual({
      status: "target_hit",
      exitPrice: 110,
    });
    expect(evaluateManagementCandle("short", shortPosition, shortStop)).toEqual({
      status: "stop_hit",
      exitPrice: 105,
    });
    expect(evaluateManagementCandle("short", shortPosition, shortTarget)).toEqual({
      status: "target_hit",
      exitPrice: 90,
    });
  });

  it("marks a candle ambiguous when OHLC touches stop and target", () => {
    const candle: Candle = {
      timestamp: 5,
      open: 100,
      high: 112,
      low: 94,
      close: 101,
    };

    expect(evaluateManagementCandle("long", longPosition, candle)).toEqual({
      status: "ambiguous",
      exitPrice: null,
    });
  });

  it("allows a stop to cross entry after price moves in favor but never to widen risk", () => {
    const position = getTrendShortPosition();

    expect(isManagedStopValid("short", position, 85.5, 83.6)).toBe(true);
    expect(isManagedStopValid("short", position, 87.4, 83.6)).toBe(false);
    expect(isManagedStopValid("short", position, 83.4, 83.6)).toBe(false);

    const tightened = applyManagedStop("short", position, 85.5, 83.6);

    expect(tightened.activeStop).toBe(85.5);
    expect(tightened.initialStop).toBe(87.2);
  });
});

describe("management scoring", () => {
  it("scores hold above an early close in the clean downtrend short", () => {
    const exercise = getExercise("trend-continuation-001");
    const position = getTrendShortPosition();
    const hold = scoreManagementAction(exercise, "short", position, 2, {
      action: "hold",
    });
    const close = scoreManagementAction(exercise, "short", position, 2, {
      action: "close",
    });

    expect(hold.score).toBe(92);
    expect(close.score).toBe(36);
    expect(hold.score).toBeGreaterThan(close.score);
  });

  it("scores a stop move from protected initial risk rather than an absolute magic price", () => {
    const exercise = getExercise("trend-continuation-001");
    const position = getTrendShortPosition();
    const initialRisk = Math.abs(position.entry - position.initialStop);
    const stopAtHalfProtectedRisk = position.initialStop - initialRisk * 0.5;
    const result = scoreManagementAction(exercise, "short", position, 5, {
      action: "move_stop",
      stop: stopAtHalfProtectedRisk,
    });

    expect(calculateProtectedRiskR("short", position, stopAtHalfProtectedRisk)).toBeCloseTo(
      0.5,
      6,
    );
    expect(result.protectedRiskR).toBeCloseTo(0.5, 6);
    expect(result.placementScore).toBe(100);
    expect(result.score).toBe(98);
  });

  it("penalizes an over-tight stop compared with the checkpoint optimal zone", () => {
    const exercise = getExercise("trend-continuation-001");
    const position = getTrendShortPosition();
    const initialRisk = Math.abs(position.entry - position.initialStop);
    const balancedStop = position.initialStop - initialRisk * 0.5;
    const overTightStop = position.initialStop - initialRisk * 1.35;
    const balanced = scoreManagementAction(exercise, "short", position, 5, {
      action: "move_stop",
      stop: balancedStop,
    });
    const overTight = scoreManagementAction(exercise, "short", position, 5, {
      action: "move_stop",
      stop: overTightStop,
    });

    expect(balanced.score).toBeGreaterThan(overTight.score);
  });

  it("does not use candles after the checkpoint to score a management decision", () => {
    const exercise = getExercise("trend-continuation-001");
    const position = getTrendShortPosition();
    const checkpointOffset = 5;
    const alteredExercise: Exercise = {
      ...exercise,
      candles: exercise.candles.map((candle, index) =>
        index > exercise.decisionIndex + checkpointOffset
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
    const original = scoreManagementAction(
      exercise,
      "short",
      position,
      checkpointOffset,
      { action: "hold" },
    );
    const altered = scoreManagementAction(
      alteredExercise,
      "short",
      position,
      checkpointOffset,
      { action: "hold" },
    );

    expect(altered).toEqual(original);
  });

  it("rejects stop widening and stop placement through the current price", () => {
    const exercise = getExercise("trend-continuation-001");
    const position = getTrendShortPosition();

    expect(() =>
      scoreManagementAction(exercise, "short", position, 5, {
        action: "move_stop",
        stop: 87.4,
      }),
    ).toThrow(RangeError);

    expect(() =>
      scoreManagementAction(exercise, "short", position, 5, {
        action: "move_stop",
        stop: 83.5,
      }),
    ).toThrow(RangeError);
  });

  it("fails loudly when asked to score an offset that is not a checkpoint", () => {
    const exercise = getExercise("trend-continuation-001");

    expect(() =>
      scoreManagementAction(exercise, "short", getTrendShortPosition(), 3, {
        action: "hold",
      }),
    ).toThrow("no management checkpoint");
  });

  it("aggregates only the decisions actually made during management", () => {
    const exercise = getExercise("trend-continuation-001");
    const position = getTrendShortPosition();
    const actions = [
      scoreManagementAction(exercise, "short", position, 2, {
        action: "hold",
      }),
      scoreManagementAction(exercise, "short", position, 5, {
        action: "close",
      }),
    ];
    const session = scoreManagementSession(actions);

    expect(session.overallScore).toBe(80);
    expect(session.actions).toEqual(actions);
  });
});
