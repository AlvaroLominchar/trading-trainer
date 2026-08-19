import { resolveTrainingExercise } from "./exercises/synthetic-catalog";
import {
  applyManagedStop,
  createManagementPosition,
  evaluateManagementCandle,
  getManagementCandle,
  getManagementCheckpoints,
  scoreManagementAction,
  scoreManagementSession,
} from "./management";
import { scoreExerciseAttempt } from "./scoring";
import {
  isTradePlanGeometryValid,
  scoreTradePlan,
} from "./trade-plan-scoring";
import {
  TRAINING_DECISIONS,
  type DirectionalDecision,
  type Exercise,
  type ManagementActionScore,
  type TradePlan,
  type TrainingDecision,
} from "./types";

const ATTEMPT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const TRAINING_ATTEMPT_OUTCOMES = [
  "no_trade",
  "stop_hit",
  "target_hit",
  "ambiguous",
  "manual_close",
  "scenario_end",
] as const;

export type TrainingAttemptOutcome =
  (typeof TRAINING_ATTEMPT_OUTCOMES)[number];

export type TrainingManagementActionSubmission =
  | {
      checkpointOffset: number;
      action: "hold";
    }
  | {
      checkpointOffset: number;
      action: "close";
    }
  | {
      checkpointOffset: number;
      action: "move_stop";
      stop: number;
    };

export type TrainingAttemptSubmission = {
  attemptId: string;
  exerciseId: string;
  exerciseVersion: number;
  decision: TrainingDecision;
  confidence: number;
  tradePlan: TradePlan | null;
  managementActions: readonly TrainingManagementActionSubmission[];
};

export type PersistedManagementAction = ManagementActionScore & {
  stop: number | null;
};

export type EvaluatedTrainingAttempt = {
  attemptId: string;
  exerciseId: string;
  exerciseVersion: number;
  exerciseTitle: string;
  timeframe: string;
  sourceKind: string;
  rubricVersion: number;
  managementRubricVersion: number | null;
  decision: TrainingDecision;
  confidence: number;
  tradePlan: TradePlan | null;
  ideaScore: number;
  ideaRating: string;
  isTopRatedDecision: boolean;
  skillScores: readonly unknown[];
  ideaSummary: string;
  ideaReasons: readonly string[];
  planScore: number | null;
  planComponentScores: readonly unknown[] | null;
  managementScore: number | null;
  managementActions: readonly PersistedManagementAction[];
  outcome: TrainingAttemptOutcome;
  exitPrice: number | null;
};

function isTrainingDecision(value: unknown): value is TrainingDecision {
  return (
    typeof value === "string" &&
    TRAINING_DECISIONS.includes(value as TrainingDecision)
  );
}

function isDirectionalDecision(
  decision: TrainingDecision,
): decision is DirectionalDecision {
  return decision === "long" || decision === "short";
}

function assertAttemptId(attemptId: string) {
  if (!ATTEMPT_ID_PATTERN.test(attemptId)) {
    throw new Error("El identificador del intento no es válido.");
  }
}

function assertConfidence(confidence: number) {
  if (
    !Number.isInteger(confidence) ||
    confidence < 50 ||
    confidence > 100
  ) {
    throw new Error("La confianza del intento no es válida.");
  }
}

function assertTradePlan(plan: TradePlan) {
  if (![plan.entry, plan.stop, plan.target].every(Number.isFinite)) {
    throw new Error("El plan del intento contiene precios no válidos.");
  }
}

function getExercise(submission: TrainingAttemptSubmission) {
  const exercise = resolveTrainingExercise(
    submission.exerciseId,
    submission.exerciseVersion,
  );

  if (!exercise) {
    throw new Error("El escenario enviado ya no coincide con esta versión.");
  }

  return exercise;
}

function assertSubmissionShape(submission: TrainingAttemptSubmission) {
  if (!submission || typeof submission !== "object") {
    throw new Error("El intento enviado no es válido.");
  }

  assertAttemptId(submission.attemptId);

  if (
    typeof submission.exerciseId !== "string" ||
    !submission.exerciseId.trim() ||
    !Number.isInteger(submission.exerciseVersion) ||
    submission.exerciseVersion < 1
  ) {
    throw new Error("El escenario enviado no es válido.");
  }

  if (!isTrainingDecision(submission.decision)) {
    throw new Error("La decisión enviada no es válida.");
  }

  assertConfidence(submission.confidence);

  if (!Array.isArray(submission.managementActions)) {
    throw new Error("Las decisiones de gestión no son válidas.");
  }
}

function evaluateDirectionalManagement(
  exercise: Exercise,
  decision: DirectionalDecision,
  tradePlan: TradePlan,
  submittedActions: readonly TrainingManagementActionSubmission[],
) {
  let position = createManagementPosition(tradePlan);
  let actionIndex = 0;
  let outcome: TrainingAttemptOutcome = "scenario_end";
  let exitPrice: number | null = null;
  const scoredActions: PersistedManagementAction[] = [];
  const checkpointsByOffset = new Map(
    getManagementCheckpoints(exercise, decision).map((checkpoint) => [
      checkpoint.afterRevealOffset,
      checkpoint,
    ]),
  );

  for (let revealOffset = 1; revealOffset <= exercise.revealCount; revealOffset += 1) {
    const candle = getManagementCandle(exercise, revealOffset);
    const evaluation = evaluateManagementCandle(
      decision,
      position,
      candle,
    );

    if (evaluation.status !== "open") {
      outcome = evaluation.status;
      exitPrice = evaluation.exitPrice;
      break;
    }

    if (!checkpointsByOffset.has(revealOffset)) {
      continue;
    }

    const submittedAction = submittedActions[actionIndex];

    if (!submittedAction || submittedAction.checkpointOffset !== revealOffset) {
      throw new Error(
        `Falta una decisión de gestión para el checkpoint ${revealOffset}.`,
      );
    }

    if (
      submittedAction.action !== "hold" &&
      submittedAction.action !== "close" &&
      submittedAction.action !== "move_stop"
    ) {
      throw new Error("La acción de gestión enviada no es válida.");
    }

    if (
      submittedAction.action === "move_stop" &&
      !Number.isFinite(submittedAction.stop)
    ) {
      throw new Error("El stop de gestión enviado no es válido.");
    }

    const actionInput =
      submittedAction.action === "move_stop"
        ? {
            action: "move_stop" as const,
            stop: submittedAction.stop,
          }
        : { action: submittedAction.action };
    const score = scoreManagementAction(
      exercise,
      decision,
      position,
      revealOffset,
      actionInput,
    );

    scoredActions.push({
      ...score,
      stop:
        submittedAction.action === "move_stop"
          ? submittedAction.stop
          : null,
    });
    actionIndex += 1;

    if (submittedAction.action === "close") {
      outcome = "manual_close";
      exitPrice = candle.close;
      break;
    }

    if (submittedAction.action === "move_stop") {
      position = applyManagedStop(
        decision,
        position,
        submittedAction.stop,
        candle.close,
      );
    }
  }

  if (actionIndex !== submittedActions.length) {
    throw new Error(
      "El intento contiene decisiones de gestión posteriores al cierre de la operación.",
    );
  }

  return {
    managementScore:
      scoredActions.length > 0
        ? scoreManagementSession(scoredActions).overallScore
        : null,
    managementActions: scoredActions,
    outcome,
    exitPrice,
  };
}

export function evaluateTrainingAttemptSubmission(
  submission: TrainingAttemptSubmission,
): EvaluatedTrainingAttempt {
  assertSubmissionShape(submission);
  const exercise = getExercise(submission);
  const ideaResult = scoreExerciseAttempt(exercise, {
    decision: submission.decision,
    confidence: submission.confidence,
  });

  if (submission.decision === "no_trade") {
    if (submission.tradePlan !== null) {
      throw new Error("No operar no puede incluir un plan de operación.");
    }

    if (submission.managementActions.length > 0) {
      throw new Error("No operar no puede incluir decisiones de gestión.");
    }

    return {
      attemptId: submission.attemptId,
      exerciseId: exercise.id,
      exerciseVersion: exercise.version,
      exerciseTitle: exercise.title,
      timeframe: exercise.timeframe,
      sourceKind: exercise.source.kind,
      rubricVersion: exercise.rubric.version,
      managementRubricVersion: null,
      decision: submission.decision,
      confidence: submission.confidence,
      tradePlan: null,
      ideaScore: ideaResult.overallScore,
      ideaRating: ideaResult.rating,
      isTopRatedDecision: ideaResult.isTopRatedDecision,
      skillScores: ideaResult.skillScores,
      ideaSummary: ideaResult.summary,
      ideaReasons: ideaResult.reasons,
      planScore: null,
      planComponentScores: null,
      managementScore: null,
      managementActions: [],
      outcome: "no_trade",
      exitPrice: null,
    };
  }

  if (!isDirectionalDecision(submission.decision)) {
    throw new Error("La decisión direccional enviada no es válida.");
  }

  if (!submission.tradePlan) {
    throw new Error("Una decisión direccional requiere un plan.");
  }

  assertTradePlan(submission.tradePlan);

  if (!isTradePlanGeometryValid(submission.decision, submission.tradePlan)) {
    throw new Error("La geometría del plan enviado no es válida.");
  }

  const planResult = scoreTradePlan(
    exercise,
    submission.decision,
    submission.tradePlan,
  );
  const management = evaluateDirectionalManagement(
    exercise,
    submission.decision,
    submission.tradePlan,
    submission.managementActions,
  );

  return {
    attemptId: submission.attemptId,
    exerciseId: exercise.id,
    exerciseVersion: exercise.version,
    exerciseTitle: exercise.title,
    timeframe: exercise.timeframe,
    sourceKind: exercise.source.kind,
    rubricVersion: exercise.rubric.version,
    managementRubricVersion:
      exercise.managementRubrics[submission.decision].version,
    decision: submission.decision,
    confidence: submission.confidence,
    tradePlan: planResult.plan,
    ideaScore: ideaResult.overallScore,
    ideaRating: ideaResult.rating,
    isTopRatedDecision: ideaResult.isTopRatedDecision,
    skillScores: ideaResult.skillScores,
    ideaSummary: ideaResult.summary,
    ideaReasons: ideaResult.reasons,
    planScore: planResult.overallScore,
    planComponentScores: planResult.componentScores,
    managementScore: management.managementScore,
    managementActions: management.managementActions,
    outcome: management.outcome,
    exitPrice: management.exitPrice,
  };
}
