"use client";

import { useEffect, useRef, useState } from "react";

import { MarketPreview } from "@/components/training/market-preview";
import { DEMO_EXERCISES } from "@/features/training/exercises/demo-exercises";
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

type SessionPhase = "deciding" | "revealing" | "result";

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
  const revealTimerRef = useRef<number | null>(null);
  const resultSectionRef = useRef<HTMLElement | null>(null);

  const exercise = DEMO_EXERCISES[exerciseIndex];
  const isRevealed = phase !== "deciding";
  const isRevealing = phase === "revealing";
  const directionalDecision = isDirectionalDecision(decision) ? decision : null;

  useEffect(() => {
    return () => {
      if (revealTimerRef.current !== null) {
        window.clearTimeout(revealTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (phase !== "result") {
      return;
    }

    resultSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [phase]);

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

    if (isDirectionalDecision(decision)) {
      if (!tradePlan || !isTradePlanGeometryValid(decision, tradePlan)) {
        return;
      }

      setTradePlanResult(scoreTradePlan(exercise, decision, tradePlan));
    } else {
      setTradePlanResult(null);
    }

    setResult(
      scoreExerciseAttempt(exercise, {
        decision,
        confidence,
      }),
    );
    setPhase("revealing");

    revealTimerRef.current = window.setTimeout(() => {
      setPhase("result");
      revealTimerRef.current = null;
    }, 650);
  }

  function handleNextExercise() {
    const nextIndex = (exerciseIndex + 1) % DEMO_EXERCISES.length;

    setExerciseIndex(nextIndex);
    setDecision(null);
    setTradePlan(null);
    setConfidence(70);
    setResult(null);
    setTradePlanResult(null);
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

  const chart = (
    <MarketPreview
      candles={exercise.candles}
      compact={phase === "result"}
      decisionIndex={exercise.decisionIndex}
      isRevealing={isRevealing}
      onTradePlanChange={setTradePlan}
      revealCount={exercise.revealCount}
      revealFuture={isRevealed}
      sourceLabel={exercise.source.label}
      timeframe={exercise.timeframe}
      tradePlan={tradePlan}
      tradePlanDecision={directionalDecision}
      tradePlanDisabled={phase !== "deciding"}
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

                <div className="mx-auto mt-6 grid max-w-[560px] gap-3 sm:grid-cols-2 xl:mx-0 xl:max-w-none">
                  <div className="rounded-2xl border border-app-border-strong bg-app-surface px-5 py-5">
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-app-text-muted">
                      Lectura
                    </span>
                    <div className="mt-3 flex items-end gap-2">
                      <span className="text-5xl font-medium tracking-[-0.05em] text-app-text">
                        {result.overallScore}
                      </span>
                      <span className="pb-1 text-xs text-app-text-muted">/ 100</span>
                    </div>
                    <p className="mt-2 text-sm text-app-text-soft">{RATING_LABELS[result.rating]}</p>
                  </div>

                  <div className="rounded-2xl border border-app-border-strong bg-app-surface px-5 py-5">
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-app-text-muted">
                      Plan
                    </span>
                    <div className="mt-3 flex items-end gap-2">
                      <span className="text-5xl font-medium tracking-[-0.05em] text-app-text">
                        {tradePlanResult ? tradePlanResult.overallScore : "--"}
                      </span>
                      {tradePlanResult ? (
                        <span className="pb-1 text-xs text-app-text-muted">/ 100</span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-app-text-soft">
                      {tradePlanResult
                        ? `${getPlanRating(tradePlanResult.overallScore)} · R:R ${tradePlanResult.rewardRisk.toFixed(2)}R`
                        : getPlanSummary(result.decision)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex justify-center xl:justify-center">
                  <button
                    className="min-h-11 rounded-xl bg-app-accent px-5 text-sm font-semibold text-app-accent-text transition hover:bg-app-accent-hover"
                    onClick={handleNextExercise}
                    type="button"
                  >
                    Siguiente escenario
                  </button>
                </div>
              </div>

              <div className="flex h-full flex-col rounded-2xl border border-app-border bg-app-page-soft/40 p-3 sm:p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1 sm:px-2">
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">
                      Revisión del escenario
                    </span>
                    <h3 className="mt-1 text-sm font-medium text-app-text">{exercise.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg border border-app-border-strong bg-app-page-soft/95 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-app-text-soft">
                      Activo oculto
                    </span>
                    <span className="rounded-lg border border-app-border-strong bg-app-page-soft/95 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-app-text-soft">
                      {formatTimeframeLabel(exercise.timeframe)}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex-1">{chart}</div>
              </div>
            </div>

            <div className="mt-7 border-t border-app-border pt-6">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-app-text">
                      Por qué
                    </h3>
                    <div className="mt-4 divide-y divide-app-border border-y border-app-border">
                      {result.reasons.map((reason, index) => (
                        <div className="flex gap-3 py-3" key={reason}>
                          <span className="mt-0.5 font-mono text-[9px] text-app-text-muted">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <p className="text-sm leading-6 text-app-text-soft">{reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-app-border pt-6">
                    <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-app-text">
                      Tu estructura
                    </h3>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {structureItems.map(([label, value]) => (
                        <div className="rounded-xl border border-app-border bg-app-page-soft px-3 py-3 text-left" key={label}>
                          <span className="block font-mono text-[8px] uppercase tracking-[0.1em] text-app-text-muted">
                            {label}
                          </span>
                          <span className="mt-1.5 block font-mono text-sm text-app-text-soft">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-app-text">
                    Desglose
                  </h3>
                  <div className="mt-4 rounded-2xl border border-app-border bg-app-page-soft/55 p-4 sm:p-5">
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text">Idea</span>
                        <span className="text-[11px] text-app-text-muted">Lectura del escenario</span>
                      </div>
                      <div className="mt-4 space-y-4">
                        {result.skillScores.map((skillScore) => (
                          <div key={skillScore.skill}>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm text-app-text-soft">
                                {SKILL_LABELS[skillScore.skill]}
                              </span>
                              <span className="font-mono text-[10px] text-app-text-muted">
                                {skillScore.score}
                              </span>
                            </div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-app-track">
                              <div
                                className="h-full rounded-full bg-app-accent transition-all duration-700"
                                style={{ width: `${skillScore.score}%` }}
                              />
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
                                <span className="text-sm text-app-text-soft">
                                  {PLAN_COMPONENT_LABELS[component.component]}
                                </span>
                                <span className="font-mono text-[10px] text-app-text-muted">
                                  {component.score}
                                </span>
                              </div>
                              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-app-track">
                                <div
                                  className="h-full rounded-full bg-app-accent transition-all duration-700"
                                  style={{ width: `${component.score}%` }}
                                />
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-xl border border-app-border bg-app-page px-4 py-4 text-sm text-app-text-muted">
                            Sin plan puntuado en este escenario.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-6 border-t border-app-border pt-4 text-[11px] text-app-text-muted">
              El tramo revelado sirve para revisar lo ocurrido; no modifica la nota de tu decisión ni la del plan.
            </p>
          </article>
        </section>
      ) : null}

      {phase === "result" ? null : (
        <section className="mt-8 grid items-stretch gap-4 2xl:grid-cols-[minmax(0,1fr)_320px]">
          <article className="rounded-3xl border border-app-border bg-app-surface-subtle p-3 sm:p-4">
            <div className="mb-3 flex flex-col gap-2 px-1 sm:px-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">
                    Escenario {String(exerciseIndex + 1).padStart(3, "0")}
                  </span>
                  <h2 className="mt-1 text-sm font-medium text-app-text">{exercise.title}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-lg border border-app-border-strong bg-app-page-soft/95 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-app-text-soft">
                    Activo oculto
                  </span>
                  <span className="rounded-lg border border-app-border-strong bg-app-page-soft/95 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-app-text-soft">
                    {formatTimeframeLabel(exercise.timeframe)}
                  </span>
                </div>
              </div>
              <p className="text-xs leading-5 text-app-text-soft">{exercise.prompt}</p>
            </div>

            {chart}
          </article>

          <aside className="flex h-full flex-col rounded-3xl border border-app-border bg-app-surface-subtle p-5 sm:p-6">
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">
                  Decisión
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-app-text-muted">
                  {phase === "revealing" ? "Revelando" : "Pendiente"}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl border border-app-border bg-app-page-soft p-1">
                {DECISION_OPTIONS.map((option) => {
                  const isSelected = decision === option.value;

                  return (
                    <button
                      aria-pressed={isSelected}
                      className={`min-h-10 rounded-lg px-2 text-[11px] font-medium transition ${
                        isSelected
                          ? "bg-app-accent text-app-accent-text"
                          : "text-app-text-soft hover:bg-app-page hover:text-app-text"
                      } ${phase !== "deciding" ? "cursor-default" : "cursor-pointer"}`}
                      disabled={phase !== "deciding"}
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
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-app-text-muted">
                  Plan
                </span>
                <span className="text-[10px] text-app-text-muted">
                  {directionalDecision ? "Arrastra las líneas" : "Opcional"}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  ["Entrada", tradePlan ? formatPrice(tradePlan.entry) : "--"],
                  ["Stop", tradePlan ? formatPrice(tradePlan.stop) : "--"],
                  ["Objetivo", tradePlan ? formatPrice(tradePlan.target) : "--"],
                  ["R:R", planRewardRisk !== null ? `${planRewardRisk.toFixed(2)}R` : "--"],
                ].map(([label, value]) => (
                  <div className="rounded-xl border border-app-border bg-app-page-soft px-3 py-2.5" key={label}>
                    <span className="block font-mono text-[8px] uppercase tracking-[0.1em] text-app-text-muted">
                      {label}
                    </span>
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
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">
                  Confianza
                </span>
                <span className="font-mono text-xs text-app-text">{confidence}%</span>
              </div>

              <input
                aria-label="Nivel de confianza"
                className="mt-4 w-full cursor-pointer disabled:cursor-default disabled:opacity-60"
                disabled={phase !== "deciding"}
                max="100"
                min="50"
                onChange={(event) => setConfidence(Number(event.target.value))}
                step="5"
                style={{ accentColor: "var(--theme-accent)" }}
                type="range"
                value={confidence}
              />

              <div className="mt-1.5 flex justify-between font-mono text-[8px] uppercase tracking-[0.1em] text-app-text-muted">
                <span>50</span>
                <span>100</span>
              </div>

              <p className="mt-3 text-[10px] text-app-text-muted">
                Calibración personal; no modifica la nota.
              </p>
            </div>

            <button
              className="mt-auto min-h-11 w-full rounded-xl bg-app-accent px-4 text-sm font-semibold text-app-accent-text transition hover:bg-app-accent-hover disabled:cursor-not-allowed disabled:opacity-35"
              disabled={!canConfirm}
              onClick={handleConfirm}
              type="button"
            >
              {phase === "revealing" ? "Revelando…" : "Confirmar lectura y plan"}
            </button>
          </aside>
        </section>
      )}
    </main>
  );
}
