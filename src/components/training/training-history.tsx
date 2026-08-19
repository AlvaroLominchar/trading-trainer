import Link from "next/link";

import {
  getDecisionLabel,
  getManagementActionLabel,
  getOutcomeLabel,
  getPlanComponentLabel,
  getSkillLabel,
  type TrainingHistoryAttempt,
} from "@/features/training/history";

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const numberFormatter = new Intl.NumberFormat("es-ES", {
  maximumFractionDigits: 4,
});

function getDecisionClasses(decision: TrainingHistoryAttempt["decision"]) {
  if (decision === "long") {
    return "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";
  }

  if (decision === "short") {
    return "border-rose-400/25 bg-rose-400/10 text-rose-300";
  }

  return "border-app-border bg-app-page-soft text-app-text-soft";
}

function formatScore(score: number | null) {
  return score === null ? "--" : `${score}`;
}

function formatPrice(price: number) {
  return numberFormatter.format(price);
}

function ScoreCard({
  label,
  score,
}: {
  label: string;
  score: number | null;
}) {
  return (
    <div className="rounded-2xl border border-app-border bg-app-page-soft px-4 py-3">
      <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-app-text-muted">
        {label}
      </span>
      <div className="mt-2 flex items-end gap-1.5">
        <strong className="text-2xl font-medium tracking-[-0.05em] text-app-text">
          {formatScore(score)}
        </strong>
        {score !== null ? (
          <span className="pb-0.5 text-[10px] text-app-text-muted">/100</span>
        ) : null}
      </div>
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-[11px] text-app-text-soft">{label}</span>
        <span className="font-mono text-[10px] text-app-text-muted">
          {score}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-app-page-soft">
        <span
          aria-hidden="true"
          className="block h-full rounded-full bg-app-accent opacity-75"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function IdeaDetail({ attempt }: { attempt: TrainingHistoryAttempt }) {
  return (
    <section className="rounded-2xl border border-app-border bg-app-page-soft p-4 sm:p-5">
      <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-app-text-muted">
        Lectura
      </span>
      <p className="mt-3 text-sm leading-6 text-app-text-soft">
        {attempt.ideaSummary}
      </p>

      {attempt.ideaReasons.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {attempt.ideaReasons.map((reason) => (
            <li
              className="flex gap-2 text-[11px] leading-5 text-app-text-muted"
              key={reason}
            >
              <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-app-accent" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {attempt.skillScores.length > 0 ? (
        <div className="mt-5 space-y-4 border-t border-app-border pt-4">
          {attempt.skillScores.map((skill) => (
            <ScoreBar
              key={skill.skill}
              label={getSkillLabel(skill.skill)}
              score={skill.score}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function PlanDetail({ attempt }: { attempt: TrainingHistoryAttempt }) {
  if (!attempt.tradePlan || !attempt.planComponentScores) {
    return (
      <section className="rounded-2xl border border-app-border bg-app-page-soft p-4 sm:p-5">
        <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-app-text-muted">
          Plan
        </span>
        <p className="mt-3 text-sm leading-6 text-app-text-muted">
          No aplicaba: decidiste no operar.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-app-border bg-app-page-soft p-4 sm:p-5">
      <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-app-text-muted">
        Plan
      </span>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          ["Entrada", attempt.tradePlan.entry],
          ["Stop", attempt.tradePlan.stop],
          ["Objetivo", attempt.tradePlan.target],
        ].map(([label, value]) => (
          <div
            className="rounded-xl border border-app-border bg-app-surface-subtle px-3 py-3"
            key={label}
          >
            <span className="block font-mono text-[8px] uppercase tracking-[0.12em] text-app-text-muted">
              {label}
            </span>
            <span className="mt-1.5 block text-xs text-app-text">
              {formatPrice(value as number)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-4 border-t border-app-border pt-4">
        {attempt.planComponentScores.map((component) => (
          <ScoreBar
            key={component.component}
            label={getPlanComponentLabel(component.component)}
            score={component.score}
          />
        ))}
      </div>
    </section>
  );
}

function ManagementDetail({ attempt }: { attempt: TrainingHistoryAttempt }) {
  if (attempt.decision === "no_trade") {
    return (
      <section className="rounded-2xl border border-app-border bg-app-page-soft p-4 sm:p-5">
        <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-app-text-muted">
          Gestión
        </span>
        <p className="mt-3 text-sm leading-6 text-app-text-muted">
          No aplicaba: no hubo operación que gestionar.
        </p>
      </section>
    );
  }

  if (attempt.managementActions.length === 0) {
    return (
      <section className="rounded-2xl border border-app-border bg-app-page-soft p-4 sm:p-5">
        <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-app-text-muted">
          Gestión
        </span>
        <p className="mt-3 text-sm leading-6 text-app-text-muted">
          La operación terminó antes de llegar a un checkpoint de gestión.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-app-border bg-app-page-soft p-4 sm:p-5">
      <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-app-text-muted">
        Gestión
      </span>

      <div className="mt-4 divide-y divide-app-border">
        {attempt.managementActions.map((action) => (
          <div
            className="py-4 first:pt-0 last:pb-0"
            key={`${action.checkpointOffset}-${action.action}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-app-text">
                    {getManagementActionLabel(action.action)}
                  </span>
                  <span className="rounded-full border border-app-border px-2 py-1 font-mono text-[8px] text-app-text-muted">
                    +{action.checkpointOffset} velas
                  </span>
                </div>
                <p className="mt-2 text-[11px] leading-5 text-app-text-muted">
                  {action.summary}
                </p>
              </div>
              <span className="shrink-0 font-mono text-xs text-app-text-soft">
                {action.score}/100
              </span>
            </div>

            {action.stop !== null ? (
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-app-text-muted">
                <span className="rounded-lg border border-app-border bg-app-surface-subtle px-2.5 py-1.5">
                  Stop {formatPrice(action.stop)}
                </span>
                {action.protectedRiskR !== null ? (
                  <span className="rounded-lg border border-app-border bg-app-surface-subtle px-2.5 py-1.5">
                    Protección {numberFormatter.format(action.protectedRiskR)}R
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function AttemptCard({
  attempt,
  position,
}: {
  attempt: TrainingHistoryAttempt;
  position: number;
}) {
  const createdDate = new Date(attempt.createdAt);

  return (
    <details className="group overflow-hidden rounded-3xl border border-app-border bg-app-surface-subtle transition duration-200 open:border-app-border-strong">
      <summary className="cursor-pointer list-none p-5 sm:p-6 [&::-webkit-details-marker]:hidden">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 xl:max-w-[48%]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-app-text-muted">
                #{String(position).padStart(2, "0")}
              </span>
              <span className="rounded-full border border-app-border px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-app-text-muted">
                {attempt.timeframe}
              </span>
              <span
                className={`rounded-full border px-2.5 py-1 text-[9px] font-medium ${getDecisionClasses(
                  attempt.decision,
                )}`}
              >
                {getDecisionLabel(attempt.decision)}
              </span>
            </div>

            <h2 className="mt-3 truncate text-lg font-medium tracking-[-0.035em] text-app-text sm:text-xl">
              {attempt.exerciseTitle}
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-app-text-muted">
              <time dateTime={attempt.createdAt}>
                {dateFormatter.format(createdDate)}
              </time>
              <span aria-hidden="true">·</span>
              <span>{getOutcomeLabel(attempt.outcome)}</span>
              <span aria-hidden="true">·</span>
              <span>Confianza {attempt.confidence}%</span>
            </div>
          </div>

          <div className="grid min-w-0 flex-1 grid-cols-3 gap-2 xl:max-w-[520px]">
            <ScoreCard label="Lectura" score={attempt.ideaScore} />
            <ScoreCard label="Plan" score={attempt.planScore} />
            <ScoreCard label="Gestión" score={attempt.managementScore} />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-app-border pt-4">
          <span className="text-[10px] text-app-text-muted">
            {attempt.isTopRatedDecision
              ? "Lectura alineada con la mejor decisión de la rúbrica"
              : "Revisa el detalle para entender la evaluación"}
          </span>
          <span className="shrink-0 rounded-lg border border-app-border px-3 py-1.5 text-[10px] text-app-text-soft transition group-open:bg-app-surface-active">
            Ver detalle
          </span>
        </div>
      </summary>

      <div className="border-t border-app-border bg-app-page-soft/35 p-5 sm:p-6">
        <div className="grid gap-3 xl:grid-cols-3">
          <IdeaDetail attempt={attempt} />
          <PlanDetail attempt={attempt} />
          <ManagementDetail attempt={attempt} />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-app-border bg-app-page-soft px-4 py-3 text-[10px] text-app-text-muted">
          <span>Desenlace: {getOutcomeLabel(attempt.outcome)}</span>
          {attempt.exitPrice !== null ? (
            <span>Salida: {formatPrice(attempt.exitPrice)}</span>
          ) : (
            <span>Sin precio de salida determinista</span>
          )}
        </div>
      </div>
    </details>
  );
}

export function TrainingHistory({
  attempts,
  unavailable = false,
}: {
  attempts: readonly TrainingHistoryAttempt[];
  unavailable?: boolean;
}) {
  if (unavailable) {
    return (
      <section className="mt-8 rounded-3xl border border-app-border bg-app-surface-subtle p-7 text-center sm:p-10">
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">
          Historial no disponible
        </span>
        <h2 className="mt-3 text-xl font-medium tracking-[-0.035em] text-app-text">
          No hemos podido cargar tus intentos.
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-app-text-muted">
          Tus ejercicios siguen guardándose de forma independiente. Recarga la página para volver a consultar el historial.
        </p>
      </section>
    );
  }

  if (attempts.length === 0) {
    return (
      <section className="mt-8 rounded-3xl border border-app-border bg-app-surface-subtle p-7 text-center sm:p-10">
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">
          Sin intentos todavía
        </span>
        <h2 className="mt-3 text-2xl font-medium tracking-[-0.04em] text-app-text">
          Tu historial empieza con una decisión.
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-app-text-muted">
          Cuando completes un escenario, aparecerán aquí su Lectura, Plan y Gestión sin mezclar las tres notas en una puntuación oficial única.
        </p>
        <Link
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-app-accent px-5 text-sm font-semibold text-app-accent-text transition duration-200 hover:bg-app-accent-hover"
          href="/train"
        >
          Empezar a entrenar
        </Link>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">
            Historial reciente
          </span>
          <h2 className="mt-2 text-xl font-medium tracking-[-0.035em] text-app-text">
            Tus últimas decisiones
          </h2>
        </div>
        <span className="text-[11px] text-app-text-muted">
          {attempts.length} {attempts.length === 1 ? "intento mostrado" : "intentos mostrados"}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {attempts.map((attempt, index) => (
          <AttemptCard
            attempt={attempt}
            key={attempt.id}
            position={index + 1}
          />
        ))}
      </div>
    </section>
  );
}
