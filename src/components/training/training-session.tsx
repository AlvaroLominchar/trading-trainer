"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { saveTrainingAttempt } from "@/app/(app)/train/actions";
import { MarketPreview } from "@/components/training/market-preview";
import {
  type TrainingManagementActionSubmission,
} from "@/features/training/attempt-persistence";
import { DEMO_EXERCISES } from "@/features/training/exercises/demo-exercises";
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
} from "@/features/training/management";
import { scoreExerciseAttempt } from "@/features/training/scoring";
import { createNeutralTradePlan } from "@/features/training/trade-plan-defaults";
import {
  calculateRewardRisk,
  isTradePlanGeometryValid,
  scoreTradePlan,
} from "@/features/training/trade-plan-scoring";
import type {
  AttemptRating,
  DirectionalDecision,
  ExerciseAttemptResult,
  ExerciseTimeframe,
  ManagementAction,
  ManagementActionScore,
  ManagementPositionState,
  ManagementSessionScore,
  TradePlan,
  TradePlanComponent,
  TradePlanResult,
  TrainingDecision,
  TrainingSkill,
} from "@/features/training/types";

const DECISION_OPTIONS: readonly {
  value: TrainingDecision;
  label: string;
}[] = [
  { value: "long", label: "Largo" },
  { value: "no_trade", label: "No operar" },
  { value: "short", label: "Corto" },
] as const;

const SKILL_LABELS: Record<TrainingSkill, string> = {
  context_reading: "Contexto",
  trend_reading: "Tendencia",
  range_reading: "Rango",
  discipline: "Disciplina",
  false_breakout: "Falsas rupturas",
};

const PLAN_COMPONENT_LABELS: Record<TradePlanComponent, string> = {
  entry: "Entrada",
  invalidation: "Invalidación",
  target: "Objetivo",
  reward_risk: "R:R",
};

const RATING_LABELS: Record<AttemptRating, string> = {
  strong: "Lectura fuerte",
  acceptable: "Decisión defendible",
  weak: "Lectura débil",
};

const MANAGEMENT_ACTION_LABELS: Record<ManagementAction, string> = {
  hold: "Mantener",
  close: "Cerrar",
  move_stop: "Proteger stop",
};

type SessionPhase =
  | "deciding"
  | "advancing"
  | "checkpoint"
  | "moving_stop"
  | "result";

type ManagementOutcome = {
  label: string;
  detail?: string;
  exitPrice: number | null;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

function isDirectionalDecision(
  decision: TrainingDecision | null,
): decision is DirectionalDecision {
  return decision === "long" || decision === "short";
}

function formatPrice(value: number) {
  return value.toFixed(2);
}

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function formatTimeframeLabel(timeframe: ExerciseTimeframe) {
  if (timeframe.endsWith("m")) {
    return `${timeframe.slice(0, -1)} min`;
  }

  if (timeframe.endsWith("h")) {
    return `${timeframe.slice(0, -1)} h`;
  }

  return timeframe;
}

function getPlanRating(score: number) {
  if (score >= 85) {
    return "Plan fuerte";
  }

  if (score >= 60) {
    return "Plan defendible";
  }

  return "Plan débil";
}

function getManagementRating(score: number) {
  if (score >= 85) {
    return "Gestión fuerte";
  }

  if (score >= 60) {
    return "Gestión defendible";
  }

  return "Gestión débil";
}

function getEvaluationSealPoints(
  result: ExerciseAttemptResult,
  tradePlanResult: TradePlanResult | null,
  managementScore: ManagementSessionScore | null,
  managementOutcome: ManagementOutcome | null,
) {
  const idea =
    result.overallScore >= 85
      ? "Lectura muy sólida"
      : result.overallScore >= 60
        ? "Lectura defendible"
        : "Lectura a revisar";

  const plan =
    result.decision === "no_trade"
      ? "Plan no necesario"
      : !tradePlanResult
        ? "Plan sin evaluar"
        : tradePlanResult.overallScore >= 85
          ? "Plan bien construido"
          : tradePlanResult.overallScore >= 60
            ? "Plan mejorable"
            : "Plan débil";

  const management =
    result.decision === "no_trade"
      ? "Gestión no necesaria"
      : managementScore
        ? managementScore.overallScore >= 85
          ? "Gestión muy sólida"
          : managementScore.overallScore >= 60
            ? "Gestión defendible"
            : "Gestión a revisar"
        : managementOutcome?.detail
          ? "Cierre automático"
          : "Gestión sin evaluar";

  return [idea, plan, management] as const;
}

function getEvaluationSummaryScore(
  result: ExerciseAttemptResult,
  tradePlanResult: TradePlanResult | null,
  managementScore: ManagementSessionScore | null,
) {
  const applicableScores = [
    result.overallScore,
    tradePlanResult?.overallScore,
    managementScore?.overallScore,
  ].filter((score): score is number => typeof score === "number");

  return Math.round(
    applicableScores.reduce((total, score) => total + score, 0) /
      applicableScores.length,
  );
}

function getEvaluationSummaryLabel(score: number) {
  if (score >= 85) {
    return "Muy sólido";
  }

  if (score >= 70) {
    return "Buen ejercicio";
  }

  if (score >= 60) {
    return "Defendible";
  }

  return "A revisar";
}

function MedalSealIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-9"
      fill="none"
      viewBox="0 0 40 40"
    >
      <path
        d="M12 4h7l3 11-7 4L12 4Z"
        fill="currentColor"
        opacity="0.18"
      />
      <path
        d="M28 4h-7l-3 11 7 4 3-15Z"
        fill="currentColor"
        opacity="0.1"
      />
      <path
        d="M12 4h7l3 11m6-11h-7l-3 11"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle cx="20" cy="24" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="m20 19 1.55 3.14 3.45.5-2.5 2.44.59 3.44L20 26.9l-3.09 1.62.59-3.44-2.5-2.44 3.45-.5L20 19Z"
        fill="currentColor"
      />
    </svg>
  );
}

function getDecisionMetaLabel(decision: TrainingDecision | null) {
  if (decision === "long") {
    return "Largo";
  }

  if (decision === "short") {
    return "Corto";
  }

  if (decision === "no_trade") {
    return "No operar";
  }

  return "Sin decisión";
}

function getPlanSummary(decision: TrainingDecision | null) {
  if (decision === "no_trade") {
    return "Sin plan · No operaste";
  }

  return "Plan pendiente";
}

function getOutcomeLabel(
  status: "stop_hit" | "target_hit" | "ambiguous",
) {
  if (status === "stop_hit") {
    return "Stop alcanzado";
  }

  if (status === "target_hit") {
    return "Objetivo alcanzado";
  }

  return "Vela ambigua · stop y objetivo tocados";
}

export function TrainingSession() {
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [decision, setDecision] = useState<TrainingDecision | null>(null);
  const [tradePlan, setTradePlan] = useState<TradePlan | null>(null);
  const [confidence, setConfidence] = useState(70);
  const [phase, setPhase] = useState<SessionPhase>("deciding");
  const [result, setResult] = useState<ExerciseAttemptResult | null>(null);
  const [tradePlanResult, setTradePlanResult] = useState<TradePlanResult | null>(
    null,
  );
  const [revealedCount, setRevealedCount] = useState(0);
  const [managementPosition, setManagementPosition] =
    useState<ManagementPositionState | null>(null);
  const [managementCheckpointIndex, setManagementCheckpointIndex] = useState(0);
  const [managementActions, setManagementActions] = useState<
    readonly ManagementActionScore[]
  >([]);
  const [managementActionInputs, setManagementActionInputs] = useState<
    readonly TrainingManagementActionSubmission[]
  >([]);
  const [managementScore, setManagementScore] =
    useState<ManagementSessionScore | null>(null);
  const [managementOutcome, setManagementOutcome] =
    useState<ManagementOutcome | null>(null);
  const [candidateStop, setCandidateStop] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const timerRef = useRef<number | null>(null);
  const resultSectionRef = useRef<HTMLElement | null>(null);
  const attemptIdRef = useRef<string | null>(null);
  const savingAttemptIdRef = useRef<string | null>(null);
  const savedAttemptIdRef = useRef<string | null>(null);

  const exercise = DEMO_EXERCISES[exerciseIndex];
  const directionalDecision = isDirectionalDecision(decision) ? decision : null;
  const managementCheckpoints = useMemo(
    () =>
      directionalDecision
        ? getManagementCheckpoints(exercise, directionalDecision)
        : [],
    [directionalDecision, exercise],
  );
  const currentCheckpoint = managementCheckpoints[managementCheckpointIndex] ?? null;

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  useEffect(() => {
    if (phase !== "result") {
      return;
    }

    resultSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [phase]);

  const persistAttempt = useCallback(
    (finalManagementActions: readonly TrainingManagementActionSubmission[]) => {
      const attemptId = attemptIdRef.current;

      if (!attemptId || !decision) {
        return;
      }

      if (
        savedAttemptIdRef.current === attemptId ||
        savingAttemptIdRef.current === attemptId
      ) {
        return;
      }

      savingAttemptIdRef.current = attemptId;
      setSaveStatus("saving");

      void saveTrainingAttempt({
        attemptId,
        exerciseId: exercise.id,
        exerciseVersion: exercise.version,
        decision,
        confidence,
        tradePlan: decision === "no_trade" ? null : tradePlan,
        managementActions: finalManagementActions,
      })
        .then((response) => {
          if (attemptIdRef.current !== attemptId) {
            return;
          }

          savingAttemptIdRef.current = null;

          if (response.status === "saved") {
            savedAttemptIdRef.current = attemptId;
            setSaveStatus("saved");
            return;
          }

          setSaveStatus("error");
        })
        .catch((error) => {
          console.error("Training attempt save request failed:", error);

          if (attemptIdRef.current !== attemptId) {
            return;
          }

          savingAttemptIdRef.current = null;
          setSaveStatus("error");
        });
    },
    [confidence, decision, exercise.id, exercise.version, tradePlan],
  );

  const finishManagement = useCallback(
    (
      finalActions: readonly ManagementActionScore[],
      finalActionInputs: readonly TrainingManagementActionSubmission[],
      outcome: ManagementOutcome,
    ) => {
      clearTimer();
      setManagementActions(finalActions);
      setManagementActionInputs(finalActionInputs);
      setManagementScore(
        finalActions.length > 0 ? scoreManagementSession(finalActions) : null,
      );
      setManagementOutcome(outcome);
      setCandidateStop(null);
      setRevealedCount(exercise.revealCount);
      setPhase("result");
      persistAttempt(finalActionInputs);
    },
    [clearTimer, exercise.revealCount, persistAttempt],
  );

  useEffect(() => {
    if (
      phase !== "advancing" ||
      !directionalDecision ||
      !managementPosition
    ) {
      return;
    }

    if (revealedCount >= exercise.revealCount) {
      clearTimer();
      timerRef.current = window.setTimeout(() => {
        finishManagement(managementActions, managementActionInputs, {
          label: "Fin del escenario",
          exitPrice: null,
        });
      }, 0);
      return clearTimer;
    }

    clearTimer();
    timerRef.current = window.setTimeout(() => {
      const nextOffset = revealedCount + 1;
      const candle = getManagementCandle(exercise, nextOffset);
      const evaluation = evaluateManagementCandle(
        directionalDecision,
        managementPosition,
        candle,
      );

      setRevealedCount(nextOffset);

      const checkpoint = managementCheckpoints[managementCheckpointIndex];

      if (evaluation.status !== "open") {
        finishManagement(managementActions, managementActionInputs, {
          label: getOutcomeLabel(evaluation.status),
          detail: checkpoint
            ? `La operación se cerró automáticamente antes del checkpoint ${managementCheckpointIndex + 1}/${managementCheckpoints.length}.`
            : "La operación se cerró automáticamente durante la gestión.",
          exitPrice: evaluation.exitPrice,
        });
        return;
      }

      if (checkpoint?.afterRevealOffset === nextOffset) {
        setPhase("checkpoint");
        return;
      }

      if (nextOffset >= exercise.revealCount) {
        finishManagement(managementActions, managementActionInputs, {
          label: "Fin del escenario · posición abierta",
          exitPrice: null,
        });
      }
    }, 420);

    return clearTimer;
  }, [
    clearTimer,
    directionalDecision,
    exercise,
    finishManagement,
    managementActionInputs,
    managementActions,
    managementCheckpointIndex,
    managementCheckpoints,
    managementPosition,
    phase,
    revealedCount,
  ]);

  function handleDecisionSelect(nextDecision: TrainingDecision) {
    if (phase !== "deciding" || nextDecision === decision) {
      return;
    }

    setDecision(nextDecision);
    setTradePlanResult(null);

    if (isDirectionalDecision(nextDecision)) {
      setTradePlan(createNeutralTradePlan(exercise, nextDecision));
    } else {
      setTradePlan(null);
    }
  }

  function handleConfirm() {
    if (!decision || phase !== "deciding") {
      return;
    }

    if (
      isDirectionalDecision(decision) &&
      (!tradePlan || !isTradePlanGeometryValid(decision, tradePlan))
    ) {
      return;
    }

    attemptIdRef.current = window.crypto.randomUUID();
    savingAttemptIdRef.current = null;
    savedAttemptIdRef.current = null;
    setSaveStatus("idle");

    const nextResult = scoreExerciseAttempt(exercise, {
      decision,
      confidence,
    });
    setResult(nextResult);
    setRevealedCount(0);
    setManagementActions([]);
    setManagementActionInputs([]);
    setManagementScore(null);
    setManagementOutcome(null);
    setManagementCheckpointIndex(0);
    setCandidateStop(null);

    if (!isDirectionalDecision(decision)) {
      setTradePlanResult(null);
      setRevealedCount(exercise.revealCount);
      setPhase("result");
      persistAttempt([]);
      return;
    }

    const confirmedTradePlan = tradePlan;

    if (!confirmedTradePlan) {
      return;
    }

    setTradePlanResult(scoreTradePlan(exercise, decision, confirmedTradePlan));
    setManagementPosition(createManagementPosition(confirmedTradePlan));
    setPhase("advancing");
  }

  function handleManagementAction(action: "hold" | "close") {
    if (
      phase !== "checkpoint" ||
      !directionalDecision ||
      !managementPosition ||
      !currentCheckpoint
    ) {
      return;
    }

    const actionInput: TrainingManagementActionSubmission = {
      checkpointOffset: currentCheckpoint.afterRevealOffset,
      action,
    };
    const actionScore = scoreManagementAction(
      exercise,
      directionalDecision,
      managementPosition,
      currentCheckpoint.afterRevealOffset,
      { action },
    );
    const nextActions = [...managementActions, actionScore];
    const nextActionInputs = [...managementActionInputs, actionInput];

    if (action === "close") {
      const currentCandle = getManagementCandle(
        exercise,
        currentCheckpoint.afterRevealOffset,
      );

      finishManagement(nextActions, nextActionInputs, {
        label: "Cierre manual",
        exitPrice: currentCandle.close,
      });
      return;
    }

    setManagementActions(nextActions);
    setManagementActionInputs(nextActionInputs);
    setManagementCheckpointIndex((index) => index + 1);
    setPhase("advancing");
  }

  function handleStartMoveStop() {
    if (phase !== "checkpoint" || !managementPosition) {
      return;
    }

    setCandidateStop(managementPosition.activeStop);
    setPhase("moving_stop");
  }

  function handleManagedPlanChange(nextPlan: TradePlan) {
    if (
      phase !== "moving_stop" ||
      !directionalDecision ||
      !managementPosition ||
      !currentCheckpoint
    ) {
      return;
    }

    const currentCandle = getManagementCandle(
      exercise,
      currentCheckpoint.afterRevealOffset,
    );

    if (
      isManagedStopValid(
        directionalDecision,
        managementPosition,
        nextPlan.stop,
        currentCandle.close,
      )
    ) {
      setCandidateStop(nextPlan.stop);
    }
  }

  function handleConfirmMovedStop() {
    if (
      phase !== "moving_stop" ||
      !directionalDecision ||
      !managementPosition ||
      !currentCheckpoint ||
      candidateStop === null
    ) {
      return;
    }

    const currentCandle = getManagementCandle(
      exercise,
      currentCheckpoint.afterRevealOffset,
    );

    if (
      !isManagedStopValid(
        directionalDecision,
        managementPosition,
        candidateStop,
        currentCandle.close,
      )
    ) {
      return;
    }

    const actionScore = scoreManagementAction(
      exercise,
      directionalDecision,
      managementPosition,
      currentCheckpoint.afterRevealOffset,
      { action: "move_stop", stop: candidateStop },
    );
    const nextPosition = applyManagedStop(
      directionalDecision,
      managementPosition,
      candidateStop,
      currentCandle.close,
    );

    setManagementPosition(nextPosition);
    setManagementActions((actions) => [...actions, actionScore]);
    setManagementActionInputs((actions) => [
      ...actions,
      {
        checkpointOffset: currentCheckpoint.afterRevealOffset,
        action: "move_stop",
        stop: candidateStop,
      },
    ]);
    setManagementCheckpointIndex((index) => index + 1);
    setCandidateStop(null);
    setPhase("advancing");
  }

  function handleCancelMoveStop() {
    if (phase !== "moving_stop") {
      return;
    }

    setCandidateStop(null);
    setPhase("checkpoint");
  }

  function handleRetrySave() {
    if (saveStatus !== "error") {
      return;
    }

    persistAttempt(managementActionInputs);
  }

  function handleNextExercise() {
    clearTimer();
    const nextIndex = (exerciseIndex + 1) % DEMO_EXERCISES.length;

    setExerciseIndex(nextIndex);
    setDecision(null);
    setTradePlan(null);
    setConfidence(70);
    setResult(null);
    setTradePlanResult(null);
    setRevealedCount(0);
    setManagementPosition(null);
    setManagementCheckpointIndex(0);
    setManagementActions([]);
    setManagementActionInputs([]);
    setManagementScore(null);
    setManagementOutcome(null);
    setCandidateStop(null);
    setSaveStatus("idle");
    attemptIdRef.current = null;
    savingAttemptIdRef.current = null;
    savedAttemptIdRef.current = null;
    setPhase("deciding");

    window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 0);
  }

  const planRewardRisk =
    directionalDecision && tradePlan
      ? calculateRewardRisk(directionalDecision, tradePlan)
      : null;
  const planRiskPercent =
    tradePlan && tradePlan.entry !== 0
      ? (Math.abs(tradePlan.entry - tradePlan.stop) / Math.abs(tradePlan.entry)) *
        100
      : null;
  const planRewardPercent =
    tradePlan && tradePlan.entry !== 0
      ? (Math.abs(tradePlan.target - tradePlan.entry) /
          Math.abs(tradePlan.entry)) *
        100
      : null;
  const canConfirm = Boolean(
    decision &&
      phase === "deciding" &&
      (!directionalDecision ||
        (tradePlan && isTradePlanGeometryValid(directionalDecision, tradePlan))),
  );

  const currentManagementCandle =
    revealedCount > 0
      ? getManagementCandle(exercise, revealedCount)
      : null;
  const activeProtectedRiskR =
    directionalDecision && managementPosition
      ? calculateProtectedRiskR(
          directionalDecision,
          managementPosition,
          managementPosition.activeStop,
        )
      : null;
  const candidateProtectedRiskR =
    directionalDecision && managementPosition && candidateStop !== null
      ? calculateProtectedRiskR(
          directionalDecision,
          managementPosition,
          candidateStop,
        )
      : null;
  const canConfirmCandidateStop = Boolean(
    phase === "moving_stop" &&
      directionalDecision &&
      managementPosition &&
      currentManagementCandle &&
      candidateStop !== null &&
      candidateStop !== managementPosition.activeStop &&
      isManagedStopValid(
        directionalDecision,
        managementPosition,
        candidateStop,
        currentManagementCandle.close,
      ),
  );

  const chartTradePlan = (() => {
    if (phase === "deciding") {
      return tradePlan;
    }

    if (!managementPosition) {
      return tradePlan;
    }

    return {
      entry: managementPosition.entry,
      stop: candidateStop ?? managementPosition.activeStop,
      target: managementPosition.target,
    };
  })();

  const chart = (
    <MarketPreview
      candles={exercise.candles}
      compact={phase === "result"}
      decisionIndex={exercise.decisionIndex}
      editableTradePlanLines={phase === "moving_stop" ? ["stop"] : undefined}
      isRevealing={phase === "advancing"}
      onTradePlanChange={
        phase === "moving_stop" ? handleManagedPlanChange : setTradePlan
      }
      revealCount={exercise.revealCount}
      revealedCount={phase === "result" ? exercise.revealCount : revealedCount}
      sourceLabel={exercise.source.label}
      timeframe={exercise.timeframe}
      tradePlan={chartTradePlan}
      tradePlanDecision={directionalDecision}
      tradePlanDisabled={phase !== "deciding" && phase !== "moving_stop"}
    />
  );

  const structureItems = tradePlanResult
    ? [
        ["Entrada", formatPrice(tradePlanResult.plan.entry)],
        ["Stop", formatPrice(tradePlanResult.plan.stop)],
        ["Objetivo", formatPrice(tradePlanResult.plan.target)],
        ["R:R", `${tradePlanResult.rewardRisk.toFixed(2)}R`],
      ]
    : [
        ["Entrada", "--"],
        ["Stop", "--"],
        ["Objetivo", "--"],
        ["R:R", "--"],
      ];

  const evaluationSealPoints = result
    ? getEvaluationSealPoints(
        result,
        tradePlanResult,
        managementScore,
        managementOutcome,
      )
    : [];
  const evaluationSummaryScore = result
    ? getEvaluationSummaryScore(result, tradePlanResult, managementScore)
    : null;

  const managementProgress = Math.round(
    (revealedCount / Math.max(exercise.revealCount, 1)) * 100,
  );
  const nextCheckpoint = managementCheckpoints[managementCheckpointIndex] ?? null;
  const candlesToNextCheckpoint = nextCheckpoint
    ? Math.max(nextCheckpoint.afterRevealOffset - revealedCount, 0)
    : Math.max(exercise.revealCount - revealedCount, 0);

  return (
    <main className="mx-auto w-full max-w-[1480px] px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
      <header className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div className="max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-app-text-muted">
              Training room
            </span>
            <span className="size-1 rounded-full bg-app-text-muted" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-app-text-muted">
              {String(exerciseIndex + 1).padStart(2, "0")} / {String(DEMO_EXERCISES.length).padStart(2, "0")}
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-medium tracking-[-0.05em] text-app-text sm:text-4xl lg:text-[4rem] lg:leading-none">
            Decide el siguiente tramo.
          </h1>

          <p className="mt-3 max-w-2xl text-sm text-app-text-soft sm:text-base">
            Construye tu lectura con la información visible y revela después qué ocurrió.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-xl border border-app-border-strong bg-app-page-soft/95 px-2.5 py-1.5 xl:self-auto">
          <span className="size-1.5 rounded-full bg-app-text-soft" />
          <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-app-text-soft">
            Desarrollo · Sin dinero real · Datos sintéticos
          </span>
        </div>
      </header>

      {phase === "result" && result ? (
        <section className="mt-8 scroll-mt-6" ref={resultSectionRef}>
          <article className="rounded-3xl border border-app-border bg-app-surface-subtle p-5 sm:p-7 lg:p-8">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.78fr)_minmax(560px,1.22fr)] xl:items-stretch">
              <div>
                <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-app-text-muted xl:justify-start">
                  <span>Resultado</span>
                  <span className="size-1 rounded-full bg-app-text-muted" />
                  <span>Escenario {String(exerciseIndex + 1).padStart(3, "0")}</span>
                </div>

                <div className="mx-auto mt-5 max-w-2xl text-center xl:mx-0 xl:max-w-none">
                  <h2 className="text-2xl font-medium tracking-[-0.04em] text-app-text sm:text-3xl lg:text-[2.45rem] lg:leading-[1.08] xl:text-center">
                    {result.summary}
                  </h2>
                  <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-app-text-muted">
                    {getDecisionMetaLabel(result.decision)} · Confianza {result.confidence}%
                  </p>
                </div>

                <div className="mx-auto mt-6 grid max-w-[640px] gap-2 sm:grid-cols-3 xl:mx-0 xl:max-w-none">
                  <div className="rounded-2xl border border-app-border-strong bg-app-surface px-4 py-4 text-center">
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-app-text-muted">Lectura</span>
                    <div className="mt-2 flex items-end justify-center gap-1.5">
                      <span className="text-4xl font-medium tracking-[-0.05em] text-app-text">{result.overallScore}</span>
                      <span className="pb-1 text-[10px] text-app-text-muted">/100</span>
                    </div>
                    <p className="mt-2 text-xs text-app-text-soft">{RATING_LABELS[result.rating]}</p>
                  </div>

                  <div className="rounded-2xl border border-app-border-strong bg-app-surface px-4 py-4 text-center">
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-app-text-muted">Plan</span>
                    <div className="mt-2 flex items-end justify-center gap-1.5">
                      <span className="text-4xl font-medium tracking-[-0.05em] text-app-text">{tradePlanResult ? tradePlanResult.overallScore : "--"}</span>
                      {tradePlanResult ? <span className="pb-1 text-[10px] text-app-text-muted">/100</span> : null}
                    </div>
                    <p className="mt-2 text-xs text-app-text-soft">
                      {tradePlanResult ? getPlanRating(tradePlanResult.overallScore) : getPlanSummary(result.decision)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-app-border-strong bg-app-surface px-4 py-4 text-center">
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-app-text-muted">Gestión</span>
                    <div className="mt-2 flex items-end justify-center gap-1.5">
                      <span className="text-4xl font-medium tracking-[-0.05em] text-app-text">{managementScore ? managementScore.overallScore : "--"}</span>
                      {managementScore ? <span className="pb-1 text-[10px] text-app-text-muted">/100</span> : null}
                    </div>
                    <p className="mt-2 text-xs text-app-text-soft">
                      {managementScore
                        ? getManagementRating(managementScore.overallScore)
                        : result.decision === "no_trade"
                          ? "Sin gestión · No operaste"
                          : "Sin checkpoint puntuado"}
                    </p>
                  </div>
                </div>

                {managementOutcome ? (
                  <div className="mt-4 text-center">
                    <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-app-text-muted">
                      {managementOutcome.label}
                      {managementOutcome.exitPrice !== null
                        ? ` · ${formatPrice(managementOutcome.exitPrice)}`
                        : ""}
                    </p>
                    {managementOutcome.detail ? (
                      <p className="mt-2 text-[11px] text-app-text-muted">{managementOutcome.detail}</p>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-5 flex flex-col items-center gap-2.5">
                  <button
                    className="min-h-11 rounded-xl bg-app-accent px-5 text-sm font-semibold text-app-accent-text transition hover:bg-app-accent-hover disabled:cursor-wait disabled:opacity-60"
                    disabled={saveStatus === "saving"}
                    onClick={handleNextExercise}
                    type="button"
                  >
                    Siguiente escenario
                  </button>

                  <div className="min-h-5 text-center font-mono text-[8px] uppercase tracking-[0.14em] text-app-text-muted">
                    {saveStatus === "saving" ? "Guardando intento…" : null}
                    {saveStatus === "saved" ? "Intento guardado" : null}
                    {saveStatus === "error" ? (
                      <button
                        className="underline decoration-app-border-strong underline-offset-4 transition hover:text-app-text-soft"
                        onClick={handleRetrySave}
                        type="button"
                      >
                        No se pudo guardar · Reintentar
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="min-w-0 flex h-full flex-col rounded-2xl border border-app-border bg-app-page-soft/40 p-3 sm:p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1 sm:px-2">
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">Revisión del escenario</span>
                    <h3 className="mt-1 text-sm font-medium text-app-text">{exercise.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg border border-app-border-strong bg-app-page-soft/95 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-app-text-soft">Activo oculto</span>
                    <span className="rounded-lg border border-app-border-strong bg-app-page-soft/95 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-app-text-soft">{formatTimeframeLabel(exercise.timeframe)}</span>
                  </div>
                </div>
                <div className="mt-3 flex-1">{chart}</div>
              </div>
            </div>

            <div className="mt-7 border-t border-app-border pt-6">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-stretch">
                <div className="flex h-full flex-col">
                  <div>
                    <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-app-text">Por qué</h3>
                    <div className="mt-4 divide-y divide-app-border border-y border-app-border">
                      {result.reasons.map((reason, index) => (
                        <div className="flex gap-3 py-3" key={reason}>
                          <span className="mt-0.5 font-mono text-[9px] text-app-text-muted">{String(index + 1).padStart(2, "0")}</span>
                          <p className="text-sm leading-6 text-app-text-soft">{reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-1 flex-col justify-center gap-6 border-t border-app-border pt-6">
                    <div className="relative mx-auto w-full max-w-[560px] overflow-hidden rounded-2xl border border-slate-400/80 bg-[linear-gradient(145deg,#d9dde2_0%,#aeb6c0_48%,#e3e6e9_100%)] px-5 py-5 text-slate-950 shadow-[0_12px_36px_rgba(0,0,0,0.22)] sm:px-6">
                      {evaluationSummaryScore !== null ? (
                        <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-slate-900/20 bg-slate-950/[0.07] px-3 py-2 text-slate-950">
                          <MedalSealIcon />
                          <div className="text-right">
                            <span className="block font-mono text-[7px] uppercase tracking-[0.16em] text-slate-900/55">
                              {getEvaluationSummaryLabel(evaluationSummaryScore)}
                            </span>
                            <span className="mt-0.5 block font-mono text-sm font-semibold tracking-[-0.03em]">
                              {evaluationSummaryScore} / 100
                            </span>
                          </div>
                        </div>
                      ) : null}

                      <div className="pr-32 sm:pr-40">
                        <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-slate-900/50">
                          Evaluación
                        </span>
                        <h3 className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-950">
                          Diagnóstico
                        </h3>
                      </div>

                      <div className="mt-5 grid gap-2.5">
                        {evaluationSealPoints.map((point) => (
                          <div
                            className="flex items-center gap-3 rounded-xl border border-slate-900/15 bg-slate-950/[0.055] px-4 py-3"
                            key={point}
                          >
                            <span className="size-1.5 shrink-0 rounded-full bg-slate-950/75" />
                            <span className="text-sm font-medium text-slate-950/80">{point}</span>
                          </div>
                        ))}
                      </div>

                      <p className="mt-4 text-center text-[9px] leading-4 text-slate-900/50">
                        Síntesis visual de las dimensiones evaluadas en esta sesión.
                      </p>
                    </div>

                    <div className="mx-auto w-full max-w-[560px]">
                      <h3 className="text-center font-mono text-[10px] uppercase tracking-[0.2em] text-app-text">Tu estructura</h3>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {structureItems.map(([label, value]) => (
                          <div
                            className="rounded-xl border border-app-border bg-app-page-soft px-4 py-3 text-left"
                            key={label}
                          >
                            <span className="block font-mono text-[8px] uppercase tracking-[0.1em] text-app-text-muted">{label}</span>
                            <span className="mt-1.5 block font-mono text-sm text-app-text-soft">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex h-full flex-col">
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-app-text">Desglose</h3>
                  <div className="mt-4 flex-1 rounded-2xl border border-app-border bg-app-page-soft/55 p-4 sm:p-5">
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text">Idea</span>
                        <span className="text-[11px] text-app-text-muted">Lectura del escenario</span>
                      </div>
                      <div className="mt-4 space-y-4">
                        {result.skillScores.map((skillScore) => (
                          <div key={skillScore.skill}>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm text-app-text-soft">{SKILL_LABELS[skillScore.skill]}</span>
                              <span className="font-mono text-[10px] text-app-text-muted">{skillScore.score}</span>
                            </div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-app-track">
                              <div className="h-full rounded-full bg-app-accent transition-all duration-700" style={{ width: `${skillScore.score}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 border-t border-app-border pt-5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text">Plan</span>
                        <span className="text-[11px] text-app-text-muted">Ejecución y estructura</span>
                      </div>
                      <div className="mt-4 space-y-4">
                        {tradePlanResult ? (
                          tradePlanResult.componentScores.map((component) => (
                            <div key={component.component}>
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-sm text-app-text-soft">{PLAN_COMPONENT_LABELS[component.component]}</span>
                                <span className="font-mono text-[10px] text-app-text-muted">{component.score}</span>
                              </div>
                              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-app-track">
                                <div className="h-full rounded-full bg-app-accent transition-all duration-700" style={{ width: `${component.score}%` }} />
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-xl border border-app-border bg-app-page px-4 py-4 text-sm text-app-text-muted">Sin plan puntuado en este escenario.</div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 border-t border-app-border pt-5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text">Gestión</span>
                        <span className="text-[11px] text-app-text-muted">Decisiones durante la operación</span>
                      </div>
                      <div className="mt-4 space-y-4">
                        {managementActions.length > 0 ? (
                          managementActions.map((action, index) => (
                            <div key={`${action.checkpointOffset}-${action.action}-${index}`}>
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-sm text-app-text-soft">C{index + 1} · {MANAGEMENT_ACTION_LABELS[action.action]}</span>
                                <span className="font-mono text-[10px] text-app-text-muted">{action.score}</span>
                              </div>
                              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-app-track">
                                <div className="h-full rounded-full bg-app-accent transition-all duration-700" style={{ width: `${action.score}%` }} />
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-xl border border-app-border bg-app-page px-4 py-4 text-sm text-app-text-muted">
                            {result.decision === "no_trade"
                              ? "No hubo gestión porque decidiste no operar."
                              : managementOutcome?.detail ?? "La operación terminó antes de un checkpoint puntuable."}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-6 border-t border-app-border pt-4 text-[11px] text-app-text-muted">
              El tramo revelado sirve para revisar lo ocurrido; las notas de lectura, plan y gestión usan únicamente la información disponible en cada decisión.
            </p>
          </article>
        </section>
      ) : null}

      {phase === "result" ? null : (
        <section className="mt-8 grid items-stretch gap-4 2xl:grid-cols-[minmax(0,1fr)_320px]">
          <article className="min-w-0 rounded-3xl border border-app-border bg-app-surface-subtle p-3 sm:p-4">
            <div className="mb-3 flex flex-col gap-2 px-1 sm:px-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">Escenario {String(exerciseIndex + 1).padStart(3, "0")}</span>
                  <h2 className="mt-1 text-sm font-medium text-app-text">{exercise.title}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg border border-app-border-strong bg-app-page-soft/95 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-app-text-soft">Activo oculto</span>
                  <span className="rounded-lg border border-app-border-strong bg-app-page-soft/95 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-app-text-soft">{formatTimeframeLabel(exercise.timeframe)}</span>
                </div>
              </div>
              <p className="text-xs leading-5 text-app-text-soft">{exercise.prompt}</p>
            </div>
            {chart}
          </article>

          {phase === "deciding" ? (
            <aside className="flex h-full flex-col rounded-3xl border border-app-border bg-app-surface-subtle p-5 sm:p-6">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">Decisión</span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-app-text-muted">Pendiente</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl border border-app-border bg-app-page-soft p-1">
                  {DECISION_OPTIONS.map((option) => {
                    const isSelected = decision === option.value;
                    return (
                      <button
                        aria-pressed={isSelected}
                        className={`min-h-10 rounded-lg px-2 text-[11px] font-medium transition ${isSelected ? "bg-app-accent text-app-accent-text" : "text-app-text-soft hover:bg-app-page hover:text-app-text"}`}
                        key={option.value}
                        onClick={() => handleDecisionSelect(option.value)}
                        type="button"
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 border-t border-app-border pt-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-app-text-muted">Plan</span>
                  <span className="text-[10px] text-app-text-muted">{directionalDecision ? "Arrastra las líneas" : "Opcional"}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    ["Entrada", tradePlan ? formatPrice(tradePlan.entry) : "--"],
                    ["Stop", tradePlan ? formatPrice(tradePlan.stop) : "--"],
                    ["Objetivo", tradePlan ? formatPrice(tradePlan.target) : "--"],
                    ["R:R", planRewardRisk !== null ? `${planRewardRisk.toFixed(2)}R` : "--"],
                  ].map(([label, value]) => (
                    <div className="rounded-xl border border-app-border bg-app-page-soft px-3 py-2.5" key={label}>
                      <span className="block font-mono text-[8px] uppercase tracking-[0.1em] text-app-text-muted">{label}</span>
                      <span className="mt-1 block font-mono text-[10px] text-app-text-soft">{value}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-app-text-muted">
                  {directionalDecision
                    ? `Riesgo ${planRiskPercent === null ? "--" : formatPercent(planRiskPercent)} · objetivo ${planRewardPercent === null ? "--" : formatPercent(planRewardPercent)}`
                    : decision === "no_trade"
                      ? "No operar no requiere estructura de entrada, stop u objetivo."
                      : "El plan aparece al elegir Largo o Corto."}
                </p>
              </div>

              <div className="mt-5 border-t border-app-border pt-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">Confianza</span>
                  <span className="font-mono text-xs text-app-text">{confidence}%</span>
                </div>
                <input
                  aria-label="Nivel de confianza"
                  className="mt-4 w-full cursor-pointer"
                  max="100"
                  min="50"
                  onChange={(event) => setConfidence(Number(event.target.value))}
                  step="5"
                  style={{ accentColor: "var(--theme-accent)" }}
                  type="range"
                  value={confidence}
                />
                <div className="mt-1.5 flex justify-between font-mono text-[8px] uppercase tracking-[0.1em] text-app-text-muted">
                  <span>50</span><span>100</span>
                </div>
                <p className="mt-3 text-[10px] text-app-text-muted">Calibración personal; no modifica la nota.</p>
              </div>

              <button
                className="mt-auto min-h-11 w-full rounded-xl bg-app-accent px-4 text-sm font-semibold text-app-accent-text transition hover:bg-app-accent-hover disabled:cursor-not-allowed disabled:opacity-35"
                disabled={!canConfirm}
                onClick={handleConfirm}
                type="button"
              >
                Confirmar lectura y plan
              </button>
            </aside>
          ) : (
            <aside className="flex h-full flex-col rounded-3xl border border-app-border bg-app-surface-subtle p-5 sm:p-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">
                  <span>Gestión</span>
                  <span className="size-1 rounded-full bg-app-text-muted" />
                  <span>{managementCheckpointIndex + 1}/{managementCheckpoints.length}</span>
                </div>
                <h2 className="mt-4 text-xl font-medium tracking-[-0.03em] text-app-text">
                  {phase === "advancing"
                    ? "Operación en curso"
                    : phase === "moving_stop"
                      ? "Protege la operación"
                      : "Toca decidir"}
                </h2>
                <p className="mx-auto mt-2 max-w-[250px] text-xs leading-5 text-app-text-muted">
                  {phase === "advancing"
                    ? `Siguiente checkpoint en ${candlesToNextCheckpoint} ${candlesToNextCheckpoint === 1 ? "vela" : "velas"}.`
                    : phase === "moving_stop"
                      ? "Ajusta únicamente el stop sobre el gráfico y confirma cuando esté donde quieres."
                      : "La operación sigue abierta. Gestiona solo con la información visible."}
                </p>
              </div>

              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-app-track">
                <div className="h-full rounded-full bg-app-accent transition-all duration-300" style={{ width: `${managementProgress}%` }} />
              </div>
              <div className="mt-2 flex justify-between font-mono text-[8px] uppercase tracking-[0.1em] text-app-text-muted">
                <span>{revealedCount}/{exercise.revealCount} velas</span>
                <span>{managementProgress}%</span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 border-t border-app-border pt-5">
                {[
                  ["Precio", currentManagementCandle ? formatPrice(currentManagementCandle.close) : "--"],
                  ["Stop", managementPosition ? formatPrice(candidateStop ?? managementPosition.activeStop) : "--"],
                  ["Protegido", `${(candidateProtectedRiskR ?? activeProtectedRiskR ?? 0).toFixed(2)}R`],
                ].map(([label, value]) => (
                  <div className="rounded-xl border border-app-border bg-app-page-soft px-2 py-2.5 text-center" key={label}>
                    <span className="block font-mono text-[8px] uppercase tracking-[0.1em] text-app-text-muted">{label}</span>
                    <span className="mt-1 block font-mono text-[10px] text-app-text-soft">{value}</span>
                  </div>
                ))}
              </div>

              {phase === "checkpoint" ? (
                <div className="mt-5 grid grid-cols-3 gap-1.5">
                  <button className="min-h-11 rounded-xl border border-app-border bg-app-page-soft px-2 text-[11px] font-medium text-app-text-soft transition hover:border-app-border-strong hover:text-app-text" onClick={() => handleManagementAction("hold")} type="button">Mantener</button>
                  <button className="min-h-11 rounded-xl border border-app-border bg-app-page-soft px-2 text-[11px] font-medium text-app-text-soft transition hover:border-app-border-strong hover:text-app-text" onClick={() => handleManagementAction("close")} type="button">Cerrar</button>
                  <button className="min-h-11 rounded-xl bg-app-accent px-2 text-[11px] font-semibold text-app-accent-text transition hover:bg-app-accent-hover" onClick={handleStartMoveStop} type="button">Proteger</button>
                </div>
              ) : null}

              {phase === "moving_stop" ? (
                <div className="mt-auto space-y-2 pt-5">
                  <button
                    className="min-h-11 w-full rounded-xl bg-app-accent px-4 text-sm font-semibold text-app-accent-text transition hover:bg-app-accent-hover disabled:cursor-not-allowed disabled:opacity-35"
                    disabled={!canConfirmCandidateStop}
                    onClick={handleConfirmMovedStop}
                    type="button"
                  >
                    Confirmar nuevo stop
                  </button>
                  <button className="min-h-10 w-full rounded-xl border border-app-border px-4 text-xs text-app-text-soft transition hover:border-app-border-strong hover:text-app-text" onClick={handleCancelMoveStop} type="button">Cancelar</button>
                </div>
              ) : phase === "advancing" ? (
                <div className="mt-auto pt-5 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-app-text-muted">Avanzando vela a vela…</div>
              ) : (
                <p className="mt-auto pt-5 text-center text-[10px] leading-5 text-app-text-muted">
                  No se muestra ninguna puntuación hasta terminar el ejercicio.
                </p>
              )}
            </aside>
          )}
        </section>
      )}
    </main>
  );
}
