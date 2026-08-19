import { describe, expect, it } from "vitest";

import {
  getDecisionLabel,
  getManagementActionLabel,
  getOutcomeLabel,
  getPlanComponentLabel,
  getSkillLabel,
  parseTrainingHistoryAttempt,
} from "./history";

function getBaseRow() {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    exercise_title: "Continuación bajista",
    timeframe: "15m",
    decision: "short",
    confidence: 72,
    trade_plan: {
      entry: 85.8,
      stop: 87.2,
      target: 80,
    },
    idea_score: 92,
    idea_rating: "strong",
    is_top_rated_decision: true,
    skill_scores: [
      {
        skill: "trend_reading",
        score: 94,
        weight: 0.6,
      },
      {
        skill: "discipline",
        score: 89,
        weight: 0.4,
      },
    ],
    idea_summary: "La lectura encaja con la estructura visible.",
    idea_reasons: ["La tendencia mantiene presión bajista."],
    plan_score: 84,
    plan_component_scores: [
      { component: "entry", score: 90, weight: 0.25 },
      { component: "invalidation", score: 82, weight: 0.35 },
      { component: "target", score: 86, weight: 0.2 },
      { component: "reward_risk", score: 78, weight: 0.2 },
    ],
    management_score: 80,
    management_actions: [
      {
        checkpointOffset: 2,
        action: "hold",
        score: 92,
        summary: "Mantener sigue siendo defendible.",
        reasons: ["La estructura no se ha invalidado."],
        protectedRiskR: null,
        placementScore: null,
        stop: null,
      },
      {
        checkpointOffset: 5,
        action: "move_stop",
        score: 68,
        summary: "Reducir riesgo tiene sentido.",
        reasons: ["El movimiento ya permite proteger parte del riesgo."],
        protectedRiskR: 0.5,
        placementScore: 60,
        stop: 86.5,
      },
    ],
    outcome: "scenario_end",
    exit_price: null,
    created_at: "2026-08-19T08:30:00.000Z",
  };
}

describe("parseTrainingHistoryAttempt", () => {
  it("normaliza un intento direccional completo", () => {
    const result = parseTrainingHistoryAttempt(getBaseRow());

    expect(result?.decision).toBe("short");
    expect(result?.tradePlan?.stop).toBe(87.2);
    expect(result?.skillScores).toHaveLength(2);
    expect(result?.planComponentScores).toHaveLength(4);
    expect(result?.managementActions[1]?.stop).toBe(86.5);
  });

  it("conserva correctamente una puntuación cero", () => {
    const result = parseTrainingHistoryAttempt({
      ...getBaseRow(),
      management_score: 0,
    });

    expect(result?.managementScore).toBe(0);
  });

  it("acepta no operar sin inventar plan ni gestión", () => {
    const result = parseTrainingHistoryAttempt({
      ...getBaseRow(),
      decision: "no_trade",
      trade_plan: null,
      plan_score: null,
      plan_component_scores: null,
      management_score: null,
      management_actions: [],
      outcome: "no_trade",
      exit_price: null,
    });

    expect(result?.decision).toBe("no_trade");
    expect(result?.tradePlan).toBeNull();
    expect(result?.planScore).toBeNull();
    expect(result?.managementScore).toBeNull();
  });

  it("rechaza filas incoherentes o manipuladas", () => {
    expect(
      parseTrainingHistoryAttempt({
        ...getBaseRow(),
        decision: "no_trade",
      }),
    ).toBeNull();

    expect(
      parseTrainingHistoryAttempt({
        ...getBaseRow(),
        decision: "invalid",
      }),
    ).toBeNull();
  });
});

describe("etiquetas del historial", () => {
  it("mantiene el vocabulario visible del entrenamiento", () => {
    expect(getDecisionLabel("long")).toBe("Largo");
    expect(getDecisionLabel("no_trade")).toBe("No operar");
    expect(getOutcomeLabel("target_hit")).toBe("Objetivo alcanzado");
    expect(getManagementActionLabel("move_stop")).toBe("Proteger");
  });

  it("traduce skills y componentes sin exponer claves internas", () => {
    expect(getSkillLabel("false_breakout")).toBe("Falsa ruptura");
    expect(getPlanComponentLabel("reward_risk")).toBe("R:R");
  });
});
