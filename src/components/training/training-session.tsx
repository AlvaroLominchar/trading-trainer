"use client";

import { useEffect, useRef, useState } from "react";

import { MarketPreview } from "@/components/training/market-preview";
import { DEMO_EXERCISES } from "@/features/training/exercises/demo-exercises";
import { scoreExerciseAttempt } from "@/features/training/scoring";
import type {
  AttemptRating,
  ExerciseAttemptResult,
  TrainingDecision,
  TrainingSkill,
} from "@/features/training/types";

const DECISION_OPTIONS: readonly {
  value: TrainingDecision;
  label: string;
  detail: string;
}[] = [
  {
    value: "long",
    label: "Largo",
    detail: "La lectura favorece continuación o recuperación alcista.",
  },
  {
    value: "no_trade",
    label: "No operar",
    detail: "El contexto no justifica asumir una dirección todavía.",
  },
  {
    value: "short",
    label: "Corto",
    detail: "La lectura favorece continuación o presión bajista.",
  },
] as const;

const SKILL_LABELS: Record<TrainingSkill, string> = {
  context_reading: "Lectura de contexto",
  trend_reading: "Lectura de tendencia",
  range_reading: "Lectura de rango",
  discipline: "Disciplina",
  false_breakout: "Falsas rupturas",
};

const RATING_LABELS: Record<AttemptRating, string> = {
  strong: "Lectura fuerte",
  acceptable: "Decisión defendible",
  weak: "Lectura débil",
};

const RATING_COPY: Record<AttemptRating, string> = {
  strong: "La decisión está muy bien alineada con la rúbrica del escenario.",
  acceptable: "Hay argumentos razonables, aunque existen opciones mejor justificadas.",
  weak: "La lectura fuerza más información de la que el gráfico ofrecía en ese momento.",
};

type SessionPhase = "deciding" | "revealing" | "result";

export function TrainingSession() {
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [decision, setDecision] = useState<TrainingDecision | null>(null);
  const [confidence, setConfidence] = useState(70);
  const [phase, setPhase] = useState<SessionPhase>("deciding");
  const [result, setResult] = useState<ExerciseAttemptResult | null>(null);
  const revealTimerRef = useRef<number | null>(null);

  const exercise = DEMO_EXERCISES[exerciseIndex];
  const isRevealed = phase !== "deciding";
  const isRevealing = phase === "revealing";

  useEffect(() => {
    return () => {
      if (revealTimerRef.current !== null) {
        window.clearTimeout(revealTimerRef.current);
      }
    };
  }, []);

  function handleConfirm() {
    if (!decision || phase !== "deciding") {
      return;
    }

    const nextResult = scoreExerciseAttempt(exercise, {
      decision,
      confidence,
    });

    setResult(nextResult);
    setPhase("revealing");

    revealTimerRef.current = window.setTimeout(() => {
      setPhase("result");
      revealTimerRef.current = null;
    }, 700);
  }

  function handleNextExercise() {
    const nextIndex = (exerciseIndex + 1) % DEMO_EXERCISES.length;

    setExerciseIndex(nextIndex);
    setDecision(null);
    setConfidence(70);
    setResult(null);
    setPhase("deciding");
  }

  const selectedDecision = DECISION_OPTIONS.find(
    (option) => option.value === decision,
  );

  return (
    <main className="mx-auto w-full max-w-[1480px] px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
      <header className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-app-text-muted">
              Training room
            </span>
            <span className="size-1 rounded-full bg-app-border-strong" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-app-text-muted">
              {String(exerciseIndex + 1).padStart(2, "0")} / {String(DEMO_EXERCISES.length).padStart(2, "0")}
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-medium tracking-[-0.05em] text-app-text sm:text-4xl lg:text-5xl">
            Lee el mercado. Decide antes de conocer el final.
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-app-text-soft sm:text-base">
            Tres escenarios sintéticos, una rúbrica previa y una regla simple: el futuro se revela después, pero nunca reescribe la calidad de tu decisión.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-xl border border-app-border bg-app-surface-subtle px-3 py-2 xl:self-auto">
          <span className="size-2 rounded-full bg-app-accent" />
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-app-text-muted">
            Desarrollo · Sin dinero real · Datos sintéticos
          </span>
        </div>
      </header>

      <section className="mt-8 grid gap-4 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <article className="rounded-3xl border border-app-border bg-app-surface-subtle p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1 sm:px-2">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">
                Escenario {String(exerciseIndex + 1).padStart(3, "0")}
              </span>
              <h2 className="mt-1 text-sm font-medium text-app-text">
                {exercise.title}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-lg border border-app-border px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-app-text-muted">
                Activo oculto
              </span>
              <span className="rounded-lg border border-app-border px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-app-text-muted">
                {exercise.timeframe}
              </span>
            </div>
          </div>

          <MarketPreview
            candles={exercise.candles}
            decisionIndex={exercise.decisionIndex}
            isRevealing={isRevealing}
            revealCount={exercise.revealCount}
            revealFuture={isRevealed}
            sourceLabel={exercise.source.label}
            timeframe={exercise.timeframe}
          />

          <div className="mt-3 rounded-2xl border border-app-border bg-app-page-soft px-4 py-3 sm:px-5">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-app-text-muted">
              Tu lectura
            </span>
            <p className="mt-2 text-xs leading-5 text-app-text-soft sm:text-sm">
              {exercise.prompt}
            </p>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {DECISION_OPTIONS.map((option) => {
              const isSelected = decision === option.value;

              return (
                <button
                  aria-pressed={isSelected}
                  className={`group min-h-[92px] rounded-2xl border px-4 text-left transition duration-200 ${
                    isSelected
                      ? "border-app-border-strong bg-app-page shadow-sm"
                      : "border-app-border bg-app-page-soft hover:border-app-border-strong hover:bg-app-page"
                  } ${phase !== "deciding" ? "cursor-default" : "cursor-pointer"}`}
                  disabled={phase !== "deciding"}
                  key={option.value}
                  onClick={() => setDecision(option.value)}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-app-text">
                      {option.label}
                    </span>
                    <span
                      className={`size-2 rounded-full transition ${
                        isSelected ? "bg-app-accent" : "bg-app-border-strong"
                      }`}
                    />
                  </div>
                  <span className="mt-2 block text-[10px] leading-4 text-app-text-muted">
                    {option.detail}
                  </span>
                </button>
              );
            })}
          </div>
        </article>

        <aside className="grid content-start gap-4 sm:grid-cols-2 2xl:grid-cols-1">
          <article className="rounded-3xl border border-app-border bg-app-surface-subtle p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">
                Estado
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-app-text-muted">
                {phase === "deciding"
                  ? "Decidiendo"
                  : phase === "revealing"
                    ? "Revelando"
                    : "Evaluado"}
              </span>
            </div>

            <h2 className="mt-2 text-xl font-medium tracking-[-0.035em] text-app-text">
              {phase === "result" && result
                ? RATING_LABELS[result.rating]
                : selectedDecision
                  ? selectedDecision.label
                  : "Elige tu decisión"}
            </h2>

            <p className="mt-3 text-xs leading-5 text-app-text-soft">
              {phase === "result" && result
                ? RATING_COPY[result.rating]
                : selectedDecision
                  ? selectedDecision.detail
                  : "No necesitas acertar el futuro. Evalúa únicamente la estructura que tienes delante."}
            </p>

            <div className="mt-6 grid grid-cols-3 gap-2">
              {["Analiza", "Decide", "Revela"].map((label, index) => {
                const activeStep =
                  phase === "deciding" ? 1 : phase === "revealing" ? 2 : 3;
                const isActive = index + 1 <= activeStep;

                return (
                  <div
                    className={`rounded-xl border px-2 py-3 text-center transition ${
                      isActive
                        ? "border-app-border-strong bg-app-page"
                        : "border-app-border bg-app-page-soft"
                    }`}
                    key={label}
                  >
                    <span className="block font-mono text-[9px] text-app-text-muted">
                      0{index + 1}
                    </span>
                    <span className="mt-1 block text-[10px] text-app-text-soft">
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="rounded-3xl border border-app-border bg-app-page-soft p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">
                Confianza
              </span>
              <span className="font-mono text-xs text-app-text-soft">
                {confidence}%
              </span>
            </div>

            <input
              aria-label="Nivel de confianza"
              className="mt-5 w-full cursor-pointer disabled:cursor-default disabled:opacity-60"
              disabled={phase !== "deciding"}
              max="100"
              min="50"
              onChange={(event) => setConfidence(Number(event.target.value))}
              step="5"
              style={{ accentColor: "var(--theme-accent)" }}
              type="range"
              value={confidence}
            />

            <div className="mt-2 flex justify-between font-mono text-[8px] uppercase tracking-[0.1em] text-app-text-muted">
              <span>50 · duda</span>
              <span>100 · máxima</span>
            </div>

            <p className="mt-4 text-xs leading-5 text-app-text-muted">
              La confianza se guarda para estudiar calibración. No suma ni resta puntos en este ejercicio.
            </p>

            <button
              className="mt-5 min-h-11 w-full rounded-xl bg-app-accent px-4 text-sm font-semibold text-app-accent-text transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!decision || phase !== "deciding"}
              onClick={handleConfirm}
              type="button"
            >
              {phase === "revealing" ? "Revelando escenario…" : "Confirmar decisión"}
            </button>
          </article>
        </aside>
      </section>

      <section
        aria-live="polite"
        className={`mt-4 grid overflow-hidden transition-all duration-500 ${
          phase === "result" && result
            ? "max-h-[1200px] translate-y-0 opacity-100"
            : "max-h-0 translate-y-2 opacity-0"
        }`}
      >
        {result ? (
          <article className="rounded-3xl border border-app-border bg-app-surface-subtle p-5 sm:p-7 lg:p-8">
            <div className="grid gap-7 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1.15fr)_minmax(280px,0.85fr)]">
              <div className="rounded-3xl border border-app-border bg-app-page-soft p-6">
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">
                  Calidad de decisión
                </span>
                <div className="mt-5 flex items-end gap-2">
                  <span className="text-6xl font-medium tracking-[-0.07em] text-app-text">
                    {result.overallScore}
                  </span>
                  <span className="pb-1.5 font-mono text-xs text-app-text-muted">
                    / 100
                  </span>
                </div>
                <span className="mt-4 inline-flex rounded-full border border-app-border-strong bg-app-page px-3 py-1.5 text-[10px] font-medium text-app-text-soft">
                  {RATING_LABELS[result.rating]}
                </span>
                {result.isTopRatedDecision ? (
                  <p className="mt-4 text-[10px] leading-4 text-app-text-muted">
                    Esta es la opción mejor alineada con la rúbrica definida antes del revelado.
                  </p>
                ) : null}
              </div>

              <div>
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">
                  Lectura
                </span>
                <h2 className="mt-2 max-w-2xl text-2xl font-medium tracking-[-0.04em] text-app-text sm:text-3xl">
                  {result.summary}
                </h2>

                <div className="mt-6 space-y-3">
                  {result.reasons.map((reason, index) => (
                    <div
                      className="flex gap-3 rounded-2xl border border-app-border bg-app-page-soft px-4 py-3"
                      key={reason}
                    >
                      <span className="grid size-6 shrink-0 place-items-center rounded-lg border border-app-border font-mono text-[8px] text-app-text-muted">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <p className="text-xs leading-5 text-app-text-soft">
                        {reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">
                    Habilidades
                  </span>
                  <span className="font-mono text-[9px] text-app-text-muted">
                    confianza {result.confidence}%
                  </span>
                </div>

                <div className="mt-5 space-y-5">
                  {result.skillScores.map((skillScore) => (
                    <div key={skillScore.skill}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-app-text-soft">
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

                <div className="mt-6 rounded-2xl border border-app-border bg-app-page-soft p-4">
                  <p className="text-[10px] leading-4 text-app-text-muted">
                    Las {exercise.revealCount} velas reveladas sirven para estudiar qué ocurrió después. No participan en tu nota de {result.overallScore}/100.
                  </p>
                </div>

                <button
                  className="mt-4 min-h-11 w-full rounded-xl border border-app-border-strong bg-app-page px-4 text-sm font-medium text-app-text transition hover:bg-app-page-soft"
                  onClick={handleNextExercise}
                  type="button"
                >
                  {exerciseIndex === DEMO_EXERCISES.length - 1
                    ? "Volver al primer escenario"
                    : "Siguiente escenario"}
                </button>
              </div>
            </div>
          </article>
        ) : null}
      </section>

      <section className="mt-4 grid gap-3 md:grid-cols-4">
        {[
          ["01", "Analiza", "Lee únicamente el contexto visible."],
          ["02", "Decide", "Elige dirección o decide esperar."],
          ["03", "Revela", "Observa el tramo que estaba oculto."],
          ["04", "Aprende", "Compara tu proceso con la rúbrica."],
        ].map(([number, label, detail]) => (
          <article
            className="rounded-2xl border border-app-border bg-app-surface-subtle p-4"
            key={number}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] text-app-text-muted">
                {number}
              </span>
              <span className="size-1.5 rounded-full bg-app-border-strong" />
            </div>
            <h3 className="mt-5 text-sm font-medium text-app-text">{label}</h3>
            <p className="mt-2 text-[11px] leading-5 text-app-text-muted">
              {detail}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
