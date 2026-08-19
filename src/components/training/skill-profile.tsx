import Link from "next/link";

import { getSkillLabel } from "@/features/training/history";
import {
  SKILL_PROFILE_ATTEMPT_LIMIT,
  SKILL_PROFILE_SIGNAL_MIN_EXERCISES,
  SKILL_PROFILE_SIGNAL_MIN_GAP,
  SKILL_PROFILE_SIGNAL_MIN_OBSERVATIONS,
  type SkillProfile,
  type SkillProfileMetric,
} from "@/features/training/skill-profile";

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-app-page-soft">
      <span
        aria-hidden="true"
        className="block h-full rounded-full bg-app-accent opacity-80"
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

function RecentEvidence({
  scores,
}: {
  scores: readonly number[];
}) {
  if (scores.length === 0) {
    return (
      <div className="flex h-10 items-end gap-1.5">
        {Array.from({ length: 6 }, (_, index) => (
          <span
            aria-hidden="true"
            className="h-1.5 flex-1 rounded-full bg-app-page-soft"
            key={index}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      aria-label={`Últimos registros: ${scores.join(", ")}`}
      className="flex h-10 items-end gap-1.5"
    >
      {scores.map((score, index) => (
        <span
          className="min-h-1.5 flex-1 rounded-t-sm bg-app-accent opacity-55"
          key={`${score}-${index}`}
          style={{ height: `${Math.max(12, score)}%` }}
        />
      ))}
    </div>
  );
}

function SkillCard({ metric }: { metric: SkillProfileMetric }) {
  const hasEvidence = metric.score !== null;

  return (
    <article className="rounded-2xl border border-app-border bg-app-page-soft p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-app-text-muted">
            Habilidad
          </span>
          <h3 className="mt-2 text-sm font-medium text-app-text">
            {getSkillLabel(metric.skill)}
          </h3>
        </div>

        <div className="text-right">
          <strong className="text-2xl font-medium tracking-[-0.05em] text-app-text">
            {metric.score ?? "--"}
          </strong>
          {hasEvidence ? (
            <span className="ml-1 text-[9px] text-app-text-muted">/100</span>
          ) : null}
        </div>
      </div>

      {hasEvidence ? (
        <>
          <div className="mt-4">
            <ScoreBar score={metric.score as number} />
          </div>

          <div className="mt-4 grid grid-cols-[1fr_auto] items-end gap-4 border-t border-app-border pt-4">
            <div>
              <span className="block font-mono text-[8px] uppercase tracking-[0.12em] text-app-text-muted">
                Evidencia reciente
              </span>
              <div className="mt-2">
                <RecentEvidence scores={metric.recentScores} />
              </div>
            </div>

            <div className="text-right text-[10px] leading-5 text-app-text-muted">
              <span className="block">
                {metric.observations} {metric.observations === 1 ? "observación" : "observaciones"}
              </span>
              <span className="block">
                {metric.uniqueExercises} {metric.uniqueExercises === 1 ? "escenario" : "escenarios"}
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-app-border-strong px-3 py-4 text-[11px] leading-5 text-app-text-muted">
          Esta habilidad todavía no ha aparecido en tus intentos guardados.
        </div>
      )}
    </article>
  );
}

function SignalCard({
  eyebrow,
  metric,
}: {
  eyebrow: string;
  metric: SkillProfileMetric;
}) {
  return (
    <div className="rounded-2xl border border-app-border bg-app-page-soft p-4">
      <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-app-text-muted">
        {eyebrow}
      </span>
      <div className="mt-3 flex items-end justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium text-app-text">
            {getSkillLabel(metric.skill)}
          </h3>
          <p className="mt-1 text-[10px] leading-5 text-app-text-muted">
            {metric.observations} observaciones · {metric.uniqueExercises} escenarios
          </p>
        </div>
        <span className="font-mono text-lg text-app-text">
          {metric.score}
        </span>
      </div>
    </div>
  );
}

export function TrainingSkillProfile({
  profile,
  unavailable = false,
}: {
  profile: SkillProfile;
  unavailable?: boolean;
}) {
  if (unavailable) {
    return (
      <section className="mt-8 rounded-3xl border border-app-border bg-app-surface-subtle p-7 text-center sm:p-10">
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">
          Perfil no disponible
        </span>
        <h2 className="mt-3 text-xl font-medium tracking-[-0.035em] text-app-text">
          No hemos podido leer tu evidencia de entrenamiento.
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-app-text-muted">
          Tus intentos siguen guardados. Recarga la página para volver a calcular el perfil.
        </p>
      </section>
    );
  }

  if (profile.attemptsAnalyzed === 0) {
    return (
      <section className="mt-8 rounded-3xl border border-app-border bg-app-surface-subtle p-7 text-center sm:p-10">
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">
          Sin evidencia todavía
        </span>
        <h2 className="mt-3 text-2xl font-medium tracking-[-0.04em] text-app-text">
          Tu perfil empieza entrenando.
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-app-text-muted">
          Las habilidades aparecerán cuando completes escenarios. No fabricamos un nivel inicial ni una nota global.
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

  const hasSignals = profile.strongestSkill && profile.focusSkill;

  return (
    <section className="mt-8 space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Intentos analizados", profile.attemptsAnalyzed],
          ["Escenarios distintos", profile.uniqueExercises],
          ["Habilidades observadas", `${profile.skillsMeasured}/5`],
        ].map(([label, value]) => (
          <div
            className="rounded-2xl border border-app-border bg-app-surface-subtle px-5 py-4"
            key={label}
          >
            <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-app-text-muted">
              {label}
            </span>
            <strong className="mt-2 block text-2xl font-medium tracking-[-0.05em] text-app-text">
              {value}
            </strong>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
        <article className="rounded-3xl border border-app-border bg-app-surface-subtle p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">
                Mapa de habilidades
              </span>
              <h2 className="mt-2 text-xl font-medium tracking-[-0.035em] text-app-text">
                Lo que tus decisiones están midiendo
              </h2>
            </div>
            <span className="text-[10px] text-app-text-muted">
              Ventana: hasta {SKILL_PROFILE_ATTEMPT_LIMIT} intentos recientes
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {profile.metrics.map((metric) => (
              <SkillCard key={metric.skill} metric={metric} />
            ))}
          </div>
        </article>

        <div className="space-y-4">
          <article className="rounded-3xl border border-app-border-strong bg-app-surface-active p-5 sm:p-6">
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">
              Señales del perfil
            </span>
            <h2 className="mt-2 text-xl font-medium tracking-[-0.035em] text-app-text">
              Diferencias con evidencia suficiente
            </h2>

            {hasSignals ? (
              <div className="mt-5 space-y-3">
                <SignalCard
                  eyebrow="Más sólida ahora"
                  metric={profile.strongestSkill as SkillProfileMetric}
                />
                <SignalCard
                  eyebrow="A reforzar"
                  metric={profile.focusSkill as SkillProfileMetric}
                />
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-app-border-strong bg-app-page-soft/55 p-4">
                <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-app-text-muted">
                  Aún sin señal clara
                </span>
                <p className="mt-2 text-xs leading-5 text-app-text-muted">
                  Seguimos acumulando variedad antes de etiquetar una fortaleza o un área a reforzar.
                </p>
              </div>
            )}

            <p className="mt-4 text-[10px] leading-5 text-app-text-muted">
              Solo comparamos habilidades con al menos {SKILL_PROFILE_SIGNAL_MIN_OBSERVATIONS} observaciones en {SKILL_PROFILE_SIGNAL_MIN_EXERCISES} escenarios distintos y una separación mínima de {SKILL_PROFILE_SIGNAL_MIN_GAP} puntos.
            </p>
          </article>

          <article className="rounded-3xl border border-app-border bg-app-surface-subtle p-5 sm:p-6">
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">
              Cómo se calcula
            </span>
            <h2 className="mt-2 text-lg font-medium tracking-[-0.03em] text-app-text">
              Evidencia, no una nota total
            </h2>
            <div className="mt-4 space-y-3 text-[11px] leading-5 text-app-text-muted">
              <p>
                Cada intento aporta una observación a las habilidades que realmente evaluó ese escenario.
              </p>
              <p>
                El perfil usa el promedio simple de esas observaciones. El peso de una habilidad dentro de la nota de Lectura no se reutiliza para inflar su importancia aquí.
              </p>
              <p>
                Repetir muchas veces el mismo escenario suma práctica, pero no basta por sí solo para declarar una fortaleza o debilidad.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
