import { describe, expect, it } from "vitest";

import {
  evaluateTrainingAttemptSubmission,
  type TrainingAttemptSubmission,
} from "./attempt-persistence";

const ATTEMPT_ID = "11111111-1111-4111-8111-111111111111";

function getBaseSubmission(
  overrides: Partial<TrainingAttemptSubmission> = {},
): TrainingAttemptSubmission {
  return {
    attemptId: ATTEMPT_ID,
    exerciseId: "trend-continuation-001",
    exerciseVersion: 1,
    decision: "short",
    confidence: 70,
    tradePlan: {
      entry: 85.8,
      stop: 87.2,
      target: 80,
    },
    managementActions: [],
    ...overrides,
  };
}

describe("evaluateTrainingAttemptSubmission", () => {
  it("recalcula en servidor la lectura de un no trade sin inventar plan ni gestión", () => {
    const result = evaluateTrainingAttemptSubmission(
      getBaseSubmission({
        exerciseId: "range-midpoint-001",
        decision: "no_trade",
        tradePlan: null,
        managementActions: [],
      }),
    );

    expect(result.decision).toBe("no_trade");
    expect(result.tradePlan).toBeNull();
    expect(result.planScore).toBeNull();
    expect(result.managementScore).toBeNull();
    expect(result.managementActions).toEqual([]);
    expect(result.outcome).toBe("no_trade");
    expect(result.ideaScore).toBeGreaterThanOrEqual(85);
  });

  it("recalcula plan y gestión a partir de las decisiones brutas del usuario", () => {
    const result = evaluateTrainingAttemptSubmission(
      getBaseSubmission({
        managementActions: [
          { checkpointOffset: 2, action: "hold" },
          { checkpointOffset: 5, action: "close" },
        ],
      }),
    );

    expect(result.planScore).toBeTypeOf("number");
    expect(result.managementScore).toBe(80);
    expect(result.managementActions.map((action) => action.score)).toEqual([
      92,
      68,
    ]);
    expect(result.outcome).toBe("manual_close");
    expect(result.exitPrice).toBeTypeOf("number");
  });

  it("conserva el stop exacto cuando el usuario protege la operación", () => {
    const result = evaluateTrainingAttemptSubmission(
      getBaseSubmission({
        managementActions: [
          { checkpointOffset: 2, action: "hold" },
          { checkpointOffset: 5, action: "move_stop", stop: 86.5 },
          { checkpointOffset: 8, action: "hold" },
        ],
      }),
    );

    const movedStop = result.managementActions.find(
      (action) => action.action === "move_stop",
    );

    expect(movedStop?.stop).toBe(86.5);
    expect(movedStop?.protectedRiskR).toBeCloseTo(0.5, 6);
  });

  it("rechaza un plan enviado para no operar", () => {
    expect(() =>
      evaluateTrainingAttemptSubmission(
        getBaseSubmission({
          exerciseId: "range-midpoint-001",
          decision: "no_trade",
          managementActions: [],
        }),
      ),
    ).toThrow("No operar no puede incluir un plan");
  });

  it("rechaza checkpoints omitidos para que no se pueda fabricar una gestión incompleta", () => {
    expect(() =>
      evaluateTrainingAttemptSubmission(
        getBaseSubmission({
          managementActions: [
            { checkpointOffset: 5, action: "close" },
          ],
        }),
      ),
    ).toThrow("Falta una decisión de gestión");
  });

  it("rechaza acciones enviadas después de que el escenario ya haya cerrado la operación", () => {
    expect(() =>
      evaluateTrainingAttemptSubmission(
        getBaseSubmission({
          tradePlan: {
            entry: 85.8,
            stop: 87.2,
            target: 85.2,
          },
          managementActions: [
            { checkpointOffset: 2, action: "hold" },
          ],
        }),
      ),
    ).toThrow("posteriores al cierre");
  });

  it("rechaza versiones de escenario que no coinciden con el código actual", () => {
    expect(() =>
      evaluateTrainingAttemptSubmission(
        getBaseSubmission({ exerciseVersion: 999 }),
      ),
    ).toThrow("ya no coincide con esta versión");
  });
});
