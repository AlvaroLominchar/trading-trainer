"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import type {
  DashboardRecentAttempt,
  DashboardSkillMetric,
  DashboardStageMetric,
  TrainingDashboardSummary,
} from "@/features/training/dashboard";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function StageBar({
  metric,
  highlighted,
}: {
  metric: DashboardStageMetric;
  highlighted: boolean;
}) {
  const fillStyle = highlighted
    ? {
        background:
          "linear-gradient(90deg, rgba(244,244,245,0.92) 0%, rgba(212,212,216,0.96) 42%, rgba(161,161,170,0.92) 100%)",
        boxShadow: "0 0 18px rgba(244,244,245,0.12)",
      }
    : undefined;

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <span className="text-sm font-medium text-app-text">{metric.label}</span>
          <span className="ml-2 text-[10px] text-app-text-muted">
            {metric.attemptCount} intento{metric.attemptCount === 1 ? "" : "s"}
          </span>
        </div>
        <div className="shrink-0">
          <span className="text-2xl font-medium tracking-[-0.04em] text-app-text">
            {metric.score ?? "—"}
          </span>
          <span className="ml-1 text-xs text-app-text-muted">/100</span>
        </div>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-app-page-soft">
        <div
          className={`relative h-full rounded-full transition-[width] duration-500 ${
            highlighted ? "" : "bg-app-accent"
          }`}
          style={{ width: `${metric.score ?? 0}%`, ...fillStyle }}
        >
          {highlighted ? (
            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center gap-1 text-[9px] leading-none text-black/60">
              <span>✦</span>
              <span className="translate-y-[-2px] text-[7px]">✦</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DecisionDonut({ summary }: { summary: TrainingDashboardSummary }) {
  const colors = {
    long: "#22c55e",
    short: "#ef4444",
    no_trade: "#737373",
  } as const;

  const segments = summary.decisionMetrics.map((metric, index, metrics) => ({
    ...metric,
    offset: metrics.slice(0, index).reduce((total, item) => total + item.share, 0),
  }));

  return (
    <div className="mt-6 grid gap-6 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
      <div className="relative mx-auto size-44">
        <svg
          aria-label="Distribución de decisiones recientes"
          className="size-full -rotate-90"
          role="img"
          viewBox="0 0 120 120"
        >
          <circle
            className="stroke-app-page-soft"
            cx="60"
            cy="60"
            fill="none"
            pathLength="100"
            r="46"
            strokeWidth="13"
          />
          {segments.map((segment) => (
            <circle
              cx="60"
              cy="60"
              fill="none"
              key={segment.decision}
              pathLength="100"
              r="46"
              stroke={colors[segment.decision]}
              strokeDasharray={`${segment.share} ${100 - segment.share}`}
              strokeDashoffset={-segment.offset}
              strokeLinecap="butt"
              strokeWidth="13"
            />
          ))}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <span className="block text-3xl font-medium tracking-[-0.05em] text-app-text">
              {summary.attemptsAnalyzed}
            </span>
            <span className="mt-1 block font-mono text-[8px] uppercase tracking-[0.13em] text-app-text-muted">
              intentos
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {summary.decisionMetrics.map((metric) => (
          <div
            className="flex items-center justify-between gap-4 rounded-xl border border-app-border bg-app-page-soft/55 px-3.5 py-3"
            key={metric.decision}
          >
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="size-2.5 rounded-full"
                style={{ backgroundColor: colors[metric.decision] }}
              />
              <span className="text-xs text-app-text-soft">{metric.label}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-app-text">{metric.share}%</span>
              <span className="ml-2 font-mono text-[9px] text-app-text-muted">
                {metric.count}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getDecisionPillClass(decision: DashboardRecentAttempt["decision"]) {
  if (decision === "long") {
    return "border-emerald-400/90 bg-white/10 text-emerald-300 shadow-[0_0_12px_rgba(34,197,94,0.22),inset_0_0_10px_rgba(34,197,94,0.05)]";
  }

  if (decision === "short") {
    return "border-rose-400/90 bg-white/10 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.2),inset_0_0_10px_rgba(244,63,94,0.05)]";
  }

  return "border-white/30 bg-white/10 text-white/90";
}

function RecentAttemptRow({ attempt }: { attempt: DashboardRecentAttempt }) {
  return (
    <div className="relative rounded-2xl border border-app-border bg-app-page-soft/55 p-4">
      {attempt.hasPerformanceSeal ? (
        <div
          aria-label="Intento destacado"
          className="absolute -right-2.5 -top-2.5 z-20 grid size-7 place-items-center rounded-full border border-amber-300/90 bg-white/10 text-[13px] leading-none text-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.28),inset_0_0_9px_rgba(251,191,36,0.05)] backdrop-blur-sm"
          title="Intento destacado"
        >
          ★
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 font-mono text-[8px] font-medium uppercase tracking-[0.12em] ${getDecisionPillClass(attempt.decision)}`}
            >
              {attempt.decisionLabel}
            </span>
            <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-app-text-muted">
              {attempt.timeframe}
            </span>
          </div>
          <h3 className="mt-3 truncate text-sm font-medium text-app-text">
            {attempt.title}
          </h3>
          <p className="mt-1 text-[11px] text-app-text-muted">
            {attempt.outcomeLabel} · {formatDateTime(attempt.createdAt)}
          </p>
        </div>

        <div className="grid shrink-0 grid-cols-3 gap-2 sm:min-w-64">
          {[
            ["Lectura", attempt.ideaScore],
            ["Plan", attempt.planScore],
            ["Gestión", attempt.managementScore],
          ].map(([label, value]) => (
            <div
              className="rounded-xl border border-app-border bg-app-surface-subtle px-3 py-2 text-center"
              key={label}
            >
              <span className="block font-mono text-[7px] uppercase tracking-[0.11em] text-app-text-muted">
                {label}
              </span>
              <span className="mt-1 block text-sm font-medium text-app-text">
                {value === null ? "—" : value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


function HistoryArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: "up" | "down";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={direction === "up" ? "Subir en el historial reciente" : "Bajar en el historial reciente"}
      className="group mx-auto grid h-8 w-12 shrink-0 place-items-center rounded-full border border-app-border-strong bg-app-surface-active text-app-text shadow-[0_0_18px_rgba(255,255,255,0.06)] transition hover:border-app-text-muted hover:bg-app-page-soft hover:shadow-[0_0_22px_rgba(255,255,255,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-border-strong disabled:cursor-default disabled:opacity-35 disabled:shadow-none disabled:hover:border-app-border-strong disabled:hover:bg-app-surface-active"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span
        aria-hidden="true"
        className={`block size-0 border-x-[5px] border-x-transparent transition-transform group-hover:scale-110 group-disabled:scale-100 ${
          direction === "up"
            ? "border-b-[7px] border-b-current"
            : "border-t-[7px] border-t-current"
        }`}
      />
    </button>
  );
}

function RecentHistoryScroller({
  attempts,
}: {
  attempts: readonly DashboardRecentAttempt[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const canScroll = attempts.length > 4;
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(canScroll);

  function updateScrollState(element: HTMLDivElement) {
    setCanScrollUp(element.scrollTop > 2);
    setCanScrollDown(
      element.scrollTop + element.clientHeight < element.scrollHeight - 2,
    );
  }

  function scrollHistory(direction: "up" | "down") {
    scrollRef.current?.scrollBy({
      behavior: "smooth",
      top: direction === "up" ? -150 : 150,
    });
  }

  return (
    <div className="mt-5 flex h-[500px] min-h-0 flex-col xl:h-auto xl:flex-1">
      {canScroll ? (
        <HistoryArrow
          direction="up"
          disabled={!canScrollUp}
          onClick={() => scrollHistory("up")}
        />
      ) : null}

      <div className={`relative min-h-0 flex-1 ${canScroll ? "my-1" : ""}`}>
        <div
          className="h-full space-y-3 overflow-y-auto pl-0.5 pr-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={(event) => updateScrollState(event.currentTarget)}
          ref={scrollRef}
          style={
            canScrollUp && canScrollDown
              ? {
                  WebkitMaskImage:
                    "linear-gradient(to bottom, transparent 0, black 46px, black calc(100% - 46px), transparent 100%)",
                  maskImage:
                    "linear-gradient(to bottom, transparent 0, black 46px, black calc(100% - 46px), transparent 100%)",
                }
              : canScrollUp
                ? {
                    WebkitMaskImage:
                      "linear-gradient(to bottom, transparent 0, black 46px, black 100%)",
                    maskImage:
                      "linear-gradient(to bottom, transparent 0, black 46px, black 100%)",
                  }
                : canScrollDown
                  ? {
                      WebkitMaskImage:
                        "linear-gradient(to bottom, black 0, black calc(100% - 46px), transparent 100%)",
                      maskImage:
                        "linear-gradient(to bottom, black 0, black calc(100% - 46px), transparent 100%)",
                    }
                  : undefined
          }
        >
          {attempts.map((attempt) => (
            <RecentAttemptRow key={attempt.id} attempt={attempt} />
          ))}
        </div>
      </div>

      {canScroll ? (
        <HistoryArrow
          direction="down"
          disabled={!canScrollDown}
          onClick={() => scrollHistory("down")}
        />
      ) : null}
    </div>
  );
}

function SkillRow({
  metric,
  strongest,
  focus,
}: {
  metric: DashboardSkillMetric;
  strongest: boolean;
  focus: boolean;
}) {
  return (
    <div className="rounded-2xl border border-app-border bg-app-page-soft/55 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-app-text">{metric.label}</span>
            {strongest ? (
              <span className="rounded-full border border-app-border-strong px-2 py-1 font-mono text-[7px] uppercase tracking-[0.11em] text-app-text-soft">
                Más sólida
              </span>
            ) : null}
            {focus ? (
              <span className="rounded-full border border-app-border-strong px-2 py-1 font-mono text-[7px] uppercase tracking-[0.11em] text-app-text-soft">
                A reforzar
              </span>
            ) : null}
          </div>
          <span className="mt-1.5 block text-[10px] text-app-text-muted">
            {metric.observations} observaciones · {metric.uniqueExercises} escenarios
          </span>
        </div>
        <span className="shrink-0 text-xl font-medium tracking-[-0.04em] text-app-text">
          {metric.score}
          <span className="ml-1 text-[10px] text-app-text-muted">/100</span>
        </span>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-app-surface-subtle">
        <div
          className="h-full rounded-full bg-app-accent"
          style={{ width: `${metric.score}%` }}
        />
      </div>
    </div>
  );
}

export function TrainingDashboard({
  summary,
  unavailable,
}: {
  summary: TrainingDashboardSummary;
  unavailable: boolean;
}) {
  const bestStageScore = Math.max(...summary.stageMetrics.map((metric) => metric.score ?? 0), 0);

  return (
    <section className="mt-7 space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-app-border bg-app-surface-subtle p-5">
          <span className="font-mono text-[8px] uppercase tracking-[0.13em] text-app-text-muted">
            Intentos
          </span>
          <span className="mt-2 block text-3xl font-medium tracking-[-0.05em] text-app-text">
            {summary.totalAttempts}
          </span>
          <p className="mt-2 text-[11px] leading-5 text-app-text-muted">
            Ejercicios terminados y guardados.
          </p>
        </article>

        <article className="rounded-2xl border border-app-border bg-app-surface-subtle p-5">
          <span className="font-mono text-[8px] uppercase tracking-[0.13em] text-app-text-muted">
            Escenarios
          </span>
          <span className="mt-2 block text-3xl font-medium tracking-[-0.05em] text-app-text">
            {summary.uniqueExercises}
          </span>
          <p className="mt-2 text-[11px] leading-5 text-app-text-muted">
            Situaciones distintas practicadas.
          </p>
        </article>

        <article className="rounded-2xl border border-app-border-strong bg-app-surface-active p-5">
          <span className="font-mono text-[8px] uppercase tracking-[0.13em] text-app-text-muted">
            Mejor opción elegida
          </span>
          <span className="mt-2 block text-3xl font-medium tracking-[-0.05em] text-app-text">
            {summary.topRatedShare}%
          </span>
          <p className="mt-2 text-[11px] leading-5 text-app-text-muted">
            {summary.topRatedCount} de {summary.attemptsAnalyzed} intentos recientes.
          </p>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <article className="rounded-3xl border border-app-border bg-app-surface-subtle p-6 sm:p-7">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">
            Lectura, Plan y Gestión
          </span>
          <h2 className="mt-2 text-xl font-medium tracking-[-0.035em] text-app-text">
            Rendimiento por fase
          </h2>
          <p className="mt-2 text-sm leading-6 text-app-text-soft">
            Cómo estás resolviendo cada parte de la decisión.
          </p>

          <div className="mt-7 space-y-7">
            {summary.stageMetrics.map((metric) => (
              <StageBar
                highlighted={(metric.score ?? 0) === bestStageScore && bestStageScore > 0}
                key={metric.key}
                metric={metric}
              />
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-app-border bg-app-surface-subtle p-6 sm:p-7">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">
            Cómo estás participando
          </span>
          <h2 className="mt-2 text-xl font-medium tracking-[-0.035em] text-app-text">
            Distribución de decisiones
          </h2>
          <p className="mt-2 text-sm leading-6 text-app-text-soft">
            Proporción de largos, cortos y decisiones de no operar.
          </p>

          <DecisionDonut summary={summary} />
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] xl:items-stretch">
        <article className="flex h-full flex-col rounded-3xl border border-app-border bg-app-surface-subtle p-6 sm:p-7 xl:h-[650px]">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">
                Tus últimos intentos
              </span>
              <h2 className="mt-2 text-xl font-medium tracking-[-0.035em] text-app-text">
                Historial reciente
              </h2>
            </div>
            <Link
              className="shrink-0 rounded-full border border-app-border-strong bg-app-surface-active px-3.5 py-2 text-xs font-medium text-app-text-soft shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_18px_rgba(255,255,255,0.04)] ring-1 ring-inset ring-white/10 transition hover:bg-app-page-soft hover:text-app-text hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_0_22px_rgba(255,255,255,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
              href="/history"
            >
              Ver historial completo
            </Link>
          </div>

          {summary.recentAttempts.length > 0 ? (
            <RecentHistoryScroller
              attempts={summary.recentAttempts}
              key={summary.recentAttempts[0]?.id ?? "recent-history"}
            />
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-app-border-strong bg-app-page-soft/55 p-5">
              <p className="text-sm leading-6 text-app-text-soft">
                Completa una sesión y aquí aparecerán tus últimos intentos.
              </p>
            </div>
          )}
        </article>

        <article className="flex h-full flex-col rounded-3xl border border-app-border bg-app-surface-subtle p-6 sm:p-7 xl:h-[650px]">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">
                Tu perfil actual
              </span>
              <h2 className="mt-2 text-xl font-medium tracking-[-0.035em] text-app-text">
                Habilidades
              </h2>
            </div>
            <Link
              className="shrink-0 rounded-full border border-app-border-strong bg-app-surface-active px-3.5 py-2 text-xs font-medium text-app-text-soft shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_18px_rgba(255,255,255,0.04)] ring-1 ring-inset ring-white/10 transition hover:bg-app-page-soft hover:text-app-text hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_0_22px_rgba(255,255,255,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
              href="/skills"
            >
              Ver habilidades
            </Link>
          </div>

          {summary.skillMetrics.length > 0 ? (
            <div className="mt-6 flex-1 space-y-3">
              {summary.skillMetrics.map((metric) => (
                <SkillRow
                  focus={summary.focusSkill?.skill === metric.skill}
                  key={metric.skill}
                  metric={metric}
                  strongest={summary.strongestSkill?.skill === metric.skill}
                />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-app-border-strong bg-app-page-soft/55 p-5">
              <p className="text-sm leading-6 text-app-text-soft">
                Tus habilidades aparecerán cuando los primeros escenarios empiecen a medirlas.
              </p>
            </div>
          )}
        </article>
      </div>

      {unavailable ? (
        <div className="rounded-2xl border border-dashed border-app-border-strong bg-app-page-soft/60 p-4">
          <p className="text-xs leading-5 text-app-text-muted">
            No pudimos leer toda la información persistida del dashboard. Conviene revisar la consulta antes de interpretar el resumen.
          </p>
        </div>
      ) : null}
    </section>
  );
}
