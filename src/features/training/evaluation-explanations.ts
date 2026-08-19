import type {
  ExerciseAttemptResult,
  ManagementAction,
  ManagementSessionScore,
  TradePlanComponent,
  TradePlanResult,
} from "./types";

export type EvaluationDimension = "idea" | "plan" | "management";

export type EvaluationExplanation = {
  dimension: EvaluationDimension;
  label: "Lectura" | "Plan" | "Gestión";
  text: string;
};

const PLAN_COMPONENT_COPY: Record<TradePlanComponent, string> = {
  entry:
    "La entrada es el punto que más penaliza el Plan: quedó menos alineada con la zona que mejor encaja con la estructura visible.",
  invalidation:
    "El stop es el punto que más penaliza el Plan: la invalidación quedó menos alineada con la zona estructural que mejor protege la idea.",
  target:
    "El objetivo es el punto que más penaliza el Plan: quedó menos alineado con el recorrido que la estructura permite justificar.",
  reward_risk:
    "La relación riesgo/beneficio es el punto que más penaliza el Plan: el equilibrio entre riesgo asumido y recorrido esperado quedó por debajo de lo deseable para este escenario.",
};

const MANAGEMENT_ACTION_LABELS: Record<ManagementAction, string> = {
  hold: "Mantener",
  close: "Cerrar",
  move_stop: "Proteger stop",
};

function getPlanExplanation(tradePlanResult: TradePlanResult) {
  const weakest = [...tradePlanResult.componentScores].sort(
    (left, right) => left.score - right.score,
  )[0];

  if (!weakest) {
    return "El Plan se evalúa por separado según Entrada, Stop, Objetivo y relación riesgo/beneficio.";
  }

  if (weakest.score >= 85) {
    return "El Plan está bien equilibrado: Entrada, Stop, Objetivo y relación riesgo/beneficio se mantienen alineados con la estructura visible.";
  }

  return PLAN_COMPONENT_COPY[weakest.component];
}

function getManagementExplanation(managementScore: ManagementSessionScore) {
  const weakest = [...managementScore.actions].sort(
    (left, right) => left.score - right.score,
  )[0];

  if (!weakest) {
    return "La Gestión se calcula a partir de las decisiones tomadas en los checkpoints que llegaron a ser puntuables.";
  }

  const checkpointIndex = managementScore.actions.findIndex(
    (action) => action === weakest,
  );
  const checkpointLabel = `C${checkpointIndex + 1} · ${MANAGEMENT_ACTION_LABELS[weakest.action]}`;

  if (weakest.score >= 85) {
    return `La Gestión fue consistente incluso en ${checkpointLabel}. ${weakest.summary}`;
  }

  return `La decisión que más penaliza la Gestión es ${checkpointLabel}. ${weakest.summary}`;
}

export function buildEvaluationExplanations({
  result,
  tradePlanResult,
  managementScore,
  managementFallbackDetail,
}: {
  result: ExerciseAttemptResult;
  tradePlanResult: TradePlanResult | null;
  managementScore: ManagementSessionScore | null;
  managementFallbackDetail?: string | null;
}): readonly EvaluationExplanation[] {
  const idea: EvaluationExplanation = {
    dimension: "idea",
    label: "Lectura",
    text: result.summary,
  };

  if (result.decision === "no_trade") {
    return [
      idea,
      {
        dimension: "plan",
        label: "Plan",
        text: "No aplica porque decidiste no operar: no hubo Entrada, Stop ni Objetivo que evaluar.",
      },
      {
        dimension: "management",
        label: "Gestión",
        text: "No aplica porque no abriste una posición y, por tanto, no hubo decisiones posteriores de gestión.",
      },
    ];
  }

  const plan: EvaluationExplanation = {
    dimension: "plan",
    label: "Plan",
    text: tradePlanResult
      ? getPlanExplanation(tradePlanResult)
      : "No hubo un Plan puntuable para comparar Entrada, Stop, Objetivo y relación riesgo/beneficio.",
  };

  const management: EvaluationExplanation = {
    dimension: "management",
    label: "Gestión",
    text: managementScore
      ? getManagementExplanation(managementScore)
      : managementFallbackDetail
        ? `No hay nota de Gestión porque la operación terminó antes de un checkpoint puntuable. ${managementFallbackDetail}`
        : "No hay nota de Gestión porque la operación terminó antes de que hubiera una decisión puntuable.",
  };

  return [idea, plan, management];
}
