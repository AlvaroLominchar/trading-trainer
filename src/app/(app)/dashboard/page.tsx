import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { UserAvatar } from "@/components/app/user-avatar";
import { getCurrentProfile } from "@/lib/auth/current-profile";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Panel principal provisional de la plantilla SaaS.",
};

const metrics = [
  {
    label: "Proyectos",
    value: "04",
    detail: "+1 este mes",
  },
  {
    label: "Usuarios",
    value: "128",
    detail: "+18,4 %",
  },
  {
    label: "Ingresos",
    value: "€2.4k",
    detail: "Últimos 30 días",
  },
];

const recentProjects = [
  {
    name: "Proyecto Analytics",
    status: "Activo",
    updatedAt: "Actualizado hoy",
  },
  {
    name: "Newsletter financiera",
    status: "Borrador",
    updatedAt: "Actualizado ayer",
  },
  {
    name: "Herramienta de valoración",
    status: "Idea",
    updatedAt: "Actualizado hace 3 días",
  },
];

export default async function DashboardPage() {
  const currentProfile = await getCurrentProfile();

  if (!currentProfile) {
    redirect("/login");
  }

  const { profile } = currentProfile;

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-600">
            Overview
          </span>

          <h1 className="mt-3 text-3xl font-medium tracking-[-0.045em] sm:text-4xl">
            Hola, {profile.firstName}
          </h1>

          <p className="mt-3 text-sm leading-6 text-neutral-500">
            Tu cuenta está autenticada y preparada para seguir construyendo.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-3 sm:flex">
            <UserAvatar
              alt={`Avatar de ${profile.displayName}`}
              avatarUrl={profile.avatarUrl}
              initial={profile.initial}
              size={42}
            />

            <div className="max-w-48">
              <span className="block truncate text-sm text-neutral-300">
                {profile.displayName}
              </span>

              <span className="mt-1 block truncate text-xs text-neutral-600">
                {profile.email}
              </span>
            </div>
          </div>

          <button
            className="min-h-11 cursor-not-allowed rounded-xl bg-white px-5 text-sm font-semibold text-black opacity-50"
            disabled
            title="Esta función se añadirá más adelante"
            type="button"
          >
            Nuevo proyecto
          </button>
        </div>
      </header>

      <div className="mt-8 inline-flex rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-neutral-600">
        Métricas de demostración
      </div>

      <section
        className="mt-4 grid gap-3 md:grid-cols-3"
        aria-label="Resumen de métricas"
      >
        {metrics.map((metric) => (
          <article
            className="rounded-2xl border border-white/10 bg-white/[0.035] p-6"
            key={metric.label}
          >
            <span className="text-xs text-neutral-500">{metric.label}</span>

            <strong className="mt-5 block text-3xl font-medium tracking-[-0.05em]">
              {metric.value}
            </strong>

            <span className="mt-3 block text-xs text-neutral-600">
              {metric.detail}
            </span>
          </article>
        ))}
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <article className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-neutral-600">Actividad</span>
              <h2 className="mt-2 text-lg font-medium">
                Crecimiento mensual
              </h2>
            </div>

            <span className="rounded-lg border border-white/10 px-3 py-2 text-[10px] text-neutral-600">
              12 meses
            </span>
          </div>

          <div className="relative mt-8 h-64 overflow-hidden rounded-xl border border-white/[0.06] bg-[#0a0a0a]">
            <div className="absolute inset-0 flex flex-col justify-between p-5">
              <span className="h-px bg-white/[0.05]" />
              <span className="h-px bg-white/[0.05]" />
              <span className="h-px bg-white/[0.05]" />
              <span className="h-px bg-white/[0.05]" />
              <span className="h-px bg-white/[0.05]" />
            </div>

            <svg
              className="absolute inset-x-0 bottom-0 h-[85%] w-full"
              preserveAspectRatio="none"
              role="presentation"
              viewBox="0 0 700 240"
            >
              <defs>
                <linearGradient
                  id="dashboardChartFill"
                  x1="0"
                  x2="0"
                  y1="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="rgba(255,255,255,0.20)"
                  />
                  <stop
                    offset="100%"
                    stopColor="rgba(255,255,255,0)"
                  />
                </linearGradient>
              </defs>

              <path
                d="M0,210 C65,205 95,181 146,187 C207,194 225,142 284,153 C343,164 371,112 426,123 C489,136 515,75 577,87 C629,97 658,45 700,32 L700,240 L0,240 Z"
                fill="url(#dashboardChartFill)"
              />

              <path
                d="M0,210 C65,205 95,181 146,187 C207,194 225,142 284,153 C343,164 371,112 426,123 C489,136 515,75 577,87 C629,97 658,45 700,32"
                fill="none"
                stroke="rgba(255,255,255,0.9)"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
          <div>
            <span className="text-xs text-neutral-600">Proyectos</span>
            <h2 className="mt-2 text-lg font-medium">Actividad reciente</h2>
          </div>

          <div className="mt-7 divide-y divide-white/[0.07]">
            {recentProjects.map((project) => (
              <div className="py-5 first:pt-0" key={project.name}>
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-sm font-medium text-neutral-200">
                    {project.name}
                  </h3>

                  <span className="rounded-full border border-white/10 px-2 py-1 text-[9px] text-neutral-500">
                    {project.status}
                  </span>
                </div>

                <p className="mt-2 text-xs text-neutral-600">
                  {project.updatedAt}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}