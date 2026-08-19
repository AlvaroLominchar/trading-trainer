import Link from "next/link";

import { getSkillLabel } from "@/features/training/history";
import {
  SKILL_PROFILE_ATTEMPT_LIMIT,
  type SkillProfile,
  type SkillProfileMetric,
} from "@/features/training/skill-profile";
import {
  TRAINING_SKILLS,
  type TrainingSkill,
} from "@/features/training/types";

const SKILL_DESCRIPTIONS: Record<TrainingSkill, string> = {
  context_reading:
    "Entender dónde está el precio dentro de la estructura general antes de decidir.",
  trend_reading:
    "Reconocer si el mercado mantiene una dirección clara o si esa tendencia está perdiendo calidad.",
  range_reading:
    "Detectar cuándo el precio está equilibrado entre dos zonas y evitar forzar una dirección que no existe.",
  discipline:
    "Respetar lo que muestra el escenario, incluido no operar cuando la ventaja no es suficiente.",
  false_breakout:
    "Detectar rupturas que no consiguen mantenerse fuera del nivel y vuelven a la estructura anterior.",
  breakout_reading:
    "Distinguir cuándo una ruptura consigue aceptación y tiene más opciones de continuar.",
  volatility_reading:
    "Leer si el movimiento se está contrayendo o expandiendo y ajustar tus expectativas al ritmo del mercado.",
  exhaustion_reading:
    "Reconocer cuándo un impulso pierde eficiencia y puede estar acercándose a una pausa o reversión.",
  retest_reading:
    "Interpretar el regreso a un nivel roto y comprobar si ahora funciona desde el lado nuevo.",
  entry_timing:
    "Elegir un punto de entrada con mejor momento y ubicación, evitando entrar demasiado pronto o perseguir el precio.",
};

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

function RecentEvidence({ scores }: { scores: readonly number[] }) {
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

function SkillInfo({ skill }: { skill: TrainingSkill }) {
  const tooltipId = `skill-info-${skill}`;

  return (
    <span className="group relative inline-flex">
      <button
        aria-describedby={tooltipId}
        aria-label={`Qué mide ${getSkillLabel(skill)}`}
        className="grid size-5 place-items-center rounded-full border border-app-border-strong bg-app-surface-active font-mono text-[9px] font-semibold text-app-text-soft transition hover:border-app-text-muted hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-border-strong"
        type="button"
      >
        i
      </button>
      <span
        className="pointer-events-none absolute left-0 top-full z-30 mt-2 w-64 max-w-[75vw] translate-y-1 rounded-xl border border-app-border-strong bg-app-surface px-3.5 py-3 text-[11px] font-normal leading-5 text-app-text-soft opacity-0 shadow-[0_18px_50px_rgba(0,0,0,0.35)] transition duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
        id={tooltipId}
        role="tooltip"
      >
        {SKILL_DESCRIPTIONS[skill]}
      </span>
    </span>
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
          <div className="mt-2 flex items-center gap-2">
            <h3 className="text-sm font-medium text-app-text">
              {getSkillLabel(metric.skill)}
            </h3>
            <SkillInfo skill={metric.skill} />
          </div>
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
  variant,
}: {
  eyebrow: string;
  metric: SkillProfileMetric;
  variant: "strongest" | "focus";
}) {
  const isStrongest = variant === "strongest";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 ${
        isStrongest
          ? "border-training-accent-border bg-training-accent-soft shadow-[0_0_26px_rgba(125,211,252,0.08)]"
          : "border-amber-300/30 bg-amber-300/[0.035] shadow-[0_0_26px_rgba(251,191,36,0.06)]"
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute left-0 top-4 h-9 w-0.5 rounded-full ${
          isStrongest ? "bg-training-accent" : "bg-amber-300"
        }`}
      />
      <span
        className={`font-mono text-[8px] uppercase tracking-[0.14em] ${
          isStrongest ? "text-training-accent" : "text-amber-200"
        }`}
      >
        {isStrongest ? "✦ " : "△ "}
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

function polarPoint(centerX: number, centerY: number, radius: number, index: number) {
  const angle = ((-90 + index * (360 / TRAINING_SKILLS.length)) * Math.PI) / 180;

  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius,
  };
}

function polygonPoints(radius: number, centerX: number, centerY: number) {
  return TRAINING_SKILLS.map((_, index) => {
    const point = polarPoint(centerX, centerY, radius, index);
    return `${point.x.toFixed(2)},${point.y.toFixed(2)}`;
  }).join(" ");
}

function SkillRadar({ metrics }: { metrics: readonly SkillProfileMetric[] }) {
  const centerX = 180;
  const centerY = 160;
  const radius = 98;
  const labelRadius = 128;
  const metricBySkill = new Map(metrics.map((metric) => [metric.skill, metric]));
  const profilePoints = TRAINING_SKILLS.map((skill, index) => {
    const score = metricBySkill.get(skill)?.score ?? 0;
    return polarPoint(centerX, centerY, radius * (score / 100), index);
  })
    .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(" ");

  return (
    <div className="mt-5">
      <svg
        aria-label="Mapa radar de las diez habilidades del perfil"
        className="mx-auto block w-full max-w-[430px]"
        role="img"
        viewBox="0 0 360 330"
      >
        {[0.25, 0.5, 0.75, 1].map((level) => (
          <polygon
            fill="none"
            key={level}
            points={polygonPoints(radius * level, centerX, centerY)}
            stroke="currentColor"
            strokeWidth="1"
            className="text-app-border"
          />
        ))}

        {TRAINING_SKILLS.map((skill, index) => {
          const edge = polarPoint(centerX, centerY, radius, index);
          const label = polarPoint(centerX, centerY, labelRadius, index);
          const textAnchor = label.x < centerX - 12 ? "end" : label.x > centerX + 12 ? "start" : "middle";
          const score = metricBySkill.get(skill)?.score;

          return (
            <g key={skill}>
              <line
                className="text-app-border"
                stroke="currentColor"
                strokeWidth="1"
                x1={centerX}
                x2={edge.x}
                y1={centerY}
                y2={edge.y}
              />
              <text
                className="text-[11px] font-semibold text-app-text-soft"
                fill="currentColor"
                textAnchor={textAnchor}
                x={label.x}
                y={label.y}
              >
                {getSkillLabel(skill)}
              </text>
              <text
                className="text-[9px] text-app-text-muted"
                fill="currentColor"
                textAnchor={textAnchor}
                x={label.x}
                y={label.y + 11}
              >
                {score ?? "--"}
              </text>
            </g>
          );
        })}

        <polygon
          className="text-training-accent"
          fill="currentColor"
          fillOpacity="0.12"
          points={profilePoints}
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="2"
        />

        {TRAINING_SKILLS.map((skill, index) => {
          const score = metricBySkill.get(skill)?.score;

          if (score === null || score === undefined) {
            return null;
          }

          const point = polarPoint(centerX, centerY, radius * (score / 100), index);

          return (
            <circle
              className="text-training-accent"
              cx={point.x}
              cy={point.y}
              fill="currentColor"
              key={`${skill}-point`}
              r="2.8"
            />
          );
        })}
      </svg>
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
          ["Habilidades observadas", `${profile.skillsMeasured}/${TRAINING_SKILLS.length}`],
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

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] xl:items-stretch">
        <article className="rounded-3xl border border-app-border bg-app-surface-subtle p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">
                Detalle por habilidad
              </span>
              <h2 className="mt-2 text-xl font-medium tracking-[-0.035em] text-app-text">
                Tu perfil, habilidad a habilidad
              </h2>
            </div>
            <span className="text-[10px] text-app-text-muted">
              Hasta {SKILL_PROFILE_ATTEMPT_LIMIT} intentos recientes
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {profile.metrics.map((metric) => (
              <SkillCard key={metric.skill} metric={metric} />
            ))}
          </div>
        </article>

        <div className="grid h-full gap-4 xl:grid-rows-[auto_auto_minmax(0,1fr)]">
          <article className="rounded-3xl border border-app-border-strong bg-app-surface-active p-5 sm:p-6">
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">
              Señales del perfil
            </span>
            <h2 className="mt-2 text-xl font-medium tracking-[-0.035em] text-app-text">
              Lo más sólido y lo que conviene reforzar
            </h2>

            {hasSignals ? (
              <div className="mt-5 space-y-3">
                <SignalCard
                  eyebrow="Más sólida ahora"
                  metric={profile.strongestSkill as SkillProfileMetric}
                  variant="strongest"
                />
                <SignalCard
                  eyebrow="A reforzar"
                  metric={profile.focusSkill as SkillProfileMetric}
                  variant="focus"
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

            <p className="mt-3 text-[10px] leading-5 text-app-text-muted">
              Solo marcamos una señal cuando hay evidencia en varios escenarios y una diferencia suficientemente clara entre habilidades.
            </p>
          </article>

          <article className="rounded-3xl border border-app-border bg-app-surface-subtle p-5 sm:p-6">
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">
              Cómo se calcula
            </span>
            <h2 className="mt-2 text-lg font-medium tracking-[-0.03em] text-app-text">
              Solo cuenta lo que ese ejercicio ha puesto a prueba
            </h2>
            <p className="mt-2 text-[11px] leading-5 text-app-text-muted">
              Cada nota es el promedio de tus evaluaciones reales para esa habilidad. Repetir suma práctica; distintos escenarios aportan variedad.
            </p>

            <div className="mt-3 divide-y divide-app-border rounded-xl border border-app-border bg-app-page-soft/55 px-3.5">
              <div className="grid grid-cols-[84px_1fr] gap-3 py-2.5">
                <span className="text-[10px] font-medium text-app-text">Observaciones</span>
                <span className="text-[10px] leading-5 text-app-text-muted">Veces que la habilidad fue evaluada.</span>
              </div>
              <div className="grid grid-cols-[84px_1fr] gap-3 py-2.5">
                <span className="text-[10px] font-medium text-app-text">Escenarios</span>
                <span className="text-[10px] leading-5 text-app-text-muted">Ejercicios distintos donde apareció.</span>
              </div>
              <div className="grid grid-cols-[84px_1fr] gap-3 py-2.5">
                <span className="text-[10px] font-medium text-app-text">Timing</span>
                <span className="text-[10px] leading-5 text-app-text-muted">Por ahora usa la nota de Entrada del Plan.</span>
              </div>
            </div>
          </article>

          <article className="flex min-h-0 flex-col rounded-3xl border border-app-border bg-app-surface-subtle p-5 sm:p-6">
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">
              Vista global
            </span>
            <h2 className="mt-2 text-lg font-medium tracking-[-0.03em] text-app-text">
              Mapa de habilidades
            </h2>
            <p className="mt-2 text-[11px] leading-5 text-app-text-muted">
              Tu perfil completo de un vistazo.
            </p>
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <SkillRadar metrics={profile.metrics} />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
