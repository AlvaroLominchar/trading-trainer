import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { OnboardingCard } from "@/components/app/onboarding-card";
import { UserAvatar } from "@/components/app/user-avatar";
import { getCurrentProfile } from "@/lib/auth/current-profile";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Panel de entrenamiento, progreso y acceso a sesiones de Trading Trainer.",
};

const skillPlaceholders = [
  "Lectura de contexto",
  "Disciplina",
  "Gestión de riesgo",
  "Calibración de confianza",
] as const;

export default async function DashboardPage() {
  const currentProfile = await getCurrentProfile();

  if (!currentProfile) {
    redirect("/login");
  }

  const { profile } = currentProfile;

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
      <header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
        <div className="max-w-2xl">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-app-text-muted">
            Dashboard
          </span>

          <h1 className="mt-3 text-3xl font-medium tracking-[-0.05em] text-app-text sm:text-4xl">
            Hola, {profile.firstName}. ¿Entrenamos una decisión?
          </h1>

          <p className="mt-3 text-sm leading-6 text-app-text-soft">
            Aquí aparecerán tus habilidades, sesiones y áreas a mejorar cuando empecemos a guardar intentos reales.
          </p>
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          <UserAvatar
            alt={`Avatar de ${profile.displayName}`}
            avatarUrl={profile.avatarUrl}
            initial={profile.initial}
            size={42}
          />
          <div className="max-w-48">
            <span className="block truncate text-sm text-app-text">
              {profile.displayName}
            </span>
            <span className="mt-1 block truncate text-xs text-app-text-muted">
              {profile.email}
            </span>
          </div>
        </div>
      </header>

      {!profile.onboardingCompleted ? (
        <OnboardingCard firstName={profile.firstName} />
      ) : null}

      <section className="mt-8 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
        <article className="relative overflow-hidden rounded-3xl border border-app-border-strong bg-app-surface-active p-6 sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full bg-app-accent opacity-[0.05] blur-3xl"
          />

          <div className="relative max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-app-border bg-app-page-soft px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-app-text-muted">
                Sesión guiada
              </span>
              <span className="rounded-full border border-app-border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-app-text-muted">
                Datos sintéticos
              </span>
            </div>

            <h2 className="mt-6 text-3xl font-medium tracking-[-0.05em] text-app-text sm:text-4xl">
              Mira el gráfico. Toma postura. Descubre el futuro después.
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-6 text-app-text-soft">
              La primera sala visual ya está preparada para alojar nuestro motor de ejercicios. Todavía no puntúa ni guarda decisiones.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-app-accent px-5 text-sm font-semibold text-app-accent-text transition duration-200 hover:bg-app-accent-hover"
                href="/train"
              >
                Entrar a la sala
              </Link>

              <span className="inline-flex min-h-11 items-center rounded-xl border border-app-border px-4 font-mono text-[9px] uppercase tracking-[0.13em] text-app-text-muted">
                Long · No trade · Short
              </span>
            </div>
          </div>

          <div className="relative mt-10 grid h-24 grid-cols-12 items-end gap-1.5 overflow-hidden rounded-2xl border border-app-border bg-app-page-soft/60 px-4 pb-4 pt-6">
            {[38, 52, 34, 63, 48, 72, 58, 81, 67, 74, 61, 88].map(
              (height, index) => (
                <span
                  className="rounded-t-sm bg-app-accent opacity-40"
                  key={`${height}-${index}`}
                  style={{ height: `${height}%` }}
                />
              ),
            )}
          </div>
        </article>

        <article className="rounded-3xl border border-app-border bg-app-surface-subtle p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">
                Reto diario
              </span>
              <h2 className="mt-2 text-xl font-medium tracking-[-0.035em] text-app-text">
                Próximamente
              </h2>
            </div>
            <span className="grid size-10 place-items-center rounded-xl border border-app-border bg-app-page-soft font-mono text-xs text-app-text-muted">
              01
            </span>
          </div>

          <p className="mt-5 text-sm leading-6 text-app-text-soft">
            Todos resolverán el mismo escenario y podremos comparar decisiones sin revelar el futuro antes de tiempo.
          </p>

          <div className="mt-6 rounded-2xl border border-dashed border-app-border-strong p-4">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-app-text-muted">
              No hay datos inventados
            </span>
            <p className="mt-2 text-xs leading-5 text-app-text-muted">
              Se activará cuando exista el modelo real de ejercicios y persistencia.
            </p>
          </div>
        </article>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
        <article className="rounded-3xl border border-app-border bg-app-surface-subtle p-6">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">
            Tu progreso
          </span>
          <h2 className="mt-2 text-xl font-medium tracking-[-0.035em] text-app-text">
            Aún no hay sesiones puntuadas
          </h2>
          <p className="mt-3 text-sm leading-6 text-app-text-soft">
            No mostraremos porcentajes ni rachas ficticias. Este espacio se llenará únicamente con intentos reales.
          </p>

          <div className="mt-6 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {skillPlaceholders.map((skill) => (
              <div
                className="flex items-center justify-between rounded-xl border border-app-border bg-app-page-soft px-4 py-3"
                key={skill}
              >
                <span className="text-xs text-app-text-soft">{skill}</span>
                <span className="font-mono text-xs text-app-text-muted">—</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-app-border bg-app-surface-subtle p-6 sm:p-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">
                Cómo entrenaremos
              </span>
              <h2 className="mt-2 text-xl font-medium tracking-[-0.035em] text-app-text">
                Cuatro momentos, una misma decisión
              </h2>
            </div>
            <span className="rounded-full border border-app-border px-3 py-1.5 text-[9px] text-app-text-muted">
              V1
            </span>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {[
              ["01", "Analiza", "Solo ves la información disponible hasta ese instante."],
              ["02", "Decide", "Elige largo, corto o no operar y declara tu confianza."],
              ["03", "Revela", "El gráfico continúa después de bloquear tu decisión."],
              ["04", "Aprende", "La evaluación separará proceso, disciplina y resultado."],
            ].map(([number, title, detail]) => (
              <div
                className="rounded-2xl border border-app-border bg-app-page-soft p-4"
                key={number}
              >
                <span className="font-mono text-[9px] text-app-text-muted">
                  {number}
                </span>
                <h3 className="mt-4 text-sm font-medium text-app-text">
                  {title}
                </h3>
                <p className="mt-2 text-[11px] leading-5 text-app-text-muted">
                  {detail}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
