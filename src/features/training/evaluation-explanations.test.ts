import { describe, expect, it } from "vitest";

import { buildEvaluationExplanations } from "./evaluation-explanations";
import type {
  ExerciseAttemptResult,
  ManagementSessionScore,
  TradePlanResult,
} from "./types";

const baseResult: ExerciseAttemptResult = {
  exerciseId: "exercise-1",
  exerciseVersion: 1,
  rubricVersion: 1,
  decision: "long",
  confidence: 70,
  overallScore: 90,
  rating: "strong",
  isTopRatedDecision: true,
  skillScores: [
    { skill: "context_reading", score: 90, weight: 1 },
  ],
  summary: "La lectura se alinea con la estructura visible.",
  reasons: ["Razón uno", "Razón dos", "Razón tres"],
};

const tradePlanResult: TradePlanResult = {
  decision: "long",
  plan: { entry: 100, stop: 95, target: 110 },
  rewardRisk: 2,
  overallScore: 64,
  componentScores: [
    { component: "entry", score: 88, weight: 0.25 },
    { component: "invalidation", score: 34, weight: 0.35 },
    { component: "target", score: 82, weight: 0.2 },
    { component: "reward_risk", score: 76, weight: 0.2 },
  ],
};

const managementScore: ManagementSessionScore = {
  overallScore: 66,
  actions: [
    {
      checkpointOffset: 2,
      action: "hold",
      score: 92,
      summary: "Mantener sigue siendo coherente.",
      reasons: ["La tesis sigue viva."],
      protectedRiskR: null,
      placementScore: null,
    },
    {
      checkpointOffset: 5,
      action: "close",
      score: 40,
      summary: "Cerrar aquí renuncia demasiado pronto al recorrido.",
      reasons: ["La estructura no estaba invalidada."],
      protectedRiskR: null,
      placementScore: null,
    },
  ],
};

describe("buildEvaluationExplanations", () => {
  it("asocia siempre una explicación a Lectura, Plan y Gestión sin repetir las notas", () => {
    const explanations = buildEvaluationExplanations({
      result: baseResult,
      tradePlanResult,
      managementScore,
    });

    expect(explanations.map((item) => item.label)).toEqual([
      "Lectura",
      "Plan",
      "Gestión",
    ]);
    expect(explanations[0].text).toBe(baseResult.summary);
    expect(explanations.every((item) => !item.text.includes("/100"))).toBe(true);
  });

  it("explica qué componente del Plan es el que más penaliza sin repetir su score", () => {
    const explanations = buildEvaluationExplanations({
      result: baseResult,
      tradePlanResult,
      managementScore,
    });

    expect(explanations[1].text.toLowerCase()).toContain("stop");
    expect(explanations[1].text).toContain("más penaliza");
    expect(explanations[1].text).not.toContain("34/100");
  });

  it("explica qué checkpoint de Gestión reduce más la nota sin repetir su score", () => {
    const explanations = buildEvaluationExplanations({
      result: baseResult,
      tradePlanResult,
      managementScore,
    });

    expect(explanations[2].text).toContain("C2 · Cerrar");
    expect(explanations[2].text).not.toContain("40/100");
    expect(explanations[2].text).toContain("renuncia demasiado pronto");
  });

  it("deja claro por qué Plan y Gestión no aplican al decidir no operar", () => {
    const explanations = buildEvaluationExplanations({
      result: { ...baseResult, decision: "no_trade" },
      tradePlanResult: null,
      managementScore: null,
    });

    expect(explanations[1].text).toContain("decidiste no operar");
    expect(explanations[2].text).toContain("no abriste una posición");
  });
});
