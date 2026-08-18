import type { Metadata } from "next";

import { MarketPreview } from "@/components/training/market-preview";

export const metadata: Metadata = {
  title: "Entrenar",
  description:
    "Espacio de entrenamiento de toma de decisiones con escenarios controlados.",
};

const sessionSteps = [
  {
    number: "01",
    label: "Analiza",
    detail: "Lee el contexto sin conocer el futuro.",
  },
  {
    number: "02",
    label: "Decide",
    detail: "Largo, corto o no operar.",
  },
  {
    number: "03",
    label: "Revela",
    detail: "Observa qué ocurrió después.",
  },
  {
    number: "04",
    label: "Aprende",
    detail: "Evalúa el proceso, no solo el resultado.",
  },
] as const;

export default function TrainPage() {
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
              V1 visual
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-medium tracking-[-0.05em] text-app-text sm:text-4xl lg:text-5xl">
            Lee el mercado. Decide antes de conocer el final.
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-app-text-soft sm:text-base">
            Esta primera sala fija la experiencia visual del entrenamiento. En el siguiente bloque conectaremos el gráfico al modelo de ejercicios y activaremos las decisiones.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-xl border border-app-border bg-app-surface-subtle px-3 py-2 xl:self-auto">
          <span className="size-2 rounded-full bg-app-accent" />
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-app-text-muted">
            Modo desarrollo · Sin dinero real
          </span>
        </div>
      </header>

      <section className="mt-8 grid gap-4 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <article className="rounded-3xl border border-app-border bg-app-surface-subtle p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1 sm:px-2">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">
                Escenario 001
              </span>
              <h2 className="mt-1 text-sm font-medium text-app-text">
                Contexto anónimo · temporalidad 15 minutos
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-lg border border-app-border px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-app-text-muted">
                Activo oculto
              </span>
              <span className="rounded-lg border border-app-border px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-app-text-muted">
                Fecha oculta
              </span>
            </div>
          </div>

          <MarketPreview />

          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {[
              ["Largo", "La activaremos con el motor de ejercicios"],
              ["No operar", "Será una decisión de primera clase"],
              ["Corto", "La activaremos con el motor de ejercicios"],
            ].map(([label, detail]) => (
              <button
                className="group min-h-[76px] cursor-not-allowed rounded-2xl border border-app-border bg-app-page-soft px-4 text-left opacity-75 transition"
                disabled
                key={label}
                type="button"
              >
                <span className="block text-sm font-medium text-app-text">
                  {label}
                </span>
                <span className="mt-1 block text-[10px] leading-4 text-app-text-muted">
                  {detail}
                </span>
              </button>
            ))}
          </div>
        </article>

        <aside className="grid content-start gap-4 sm:grid-cols-2 2xl:grid-cols-1">
          <article className="rounded-3xl border border-app-border bg-app-surface-subtle p-5 sm:p-6">
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">
              Sesión
            </span>
            <h2 className="mt-2 text-xl font-medium tracking-[-0.035em] text-app-text">
              El proceso importa
            </h2>
            <p className="mt-3 text-xs leading-5 text-app-text-soft">
              Una operación ganadora podrá recibir mala nota y una pérdida bien ejecutada podrá estar correctamente resuelta.
            </p>

            <div className="mt-6 space-y-4">
              {sessionSteps.map((step) => (
                <div className="flex gap-3" key={step.number}>
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-app-border bg-app-page-soft font-mono text-[9px] text-app-text-muted">
                    {step.number}
                  </span>
                  <div>
                    <span className="block text-xs font-medium text-app-text">
                      {step.label}
                    </span>
                    <span className="mt-1 block text-[10px] leading-4 text-app-text-muted">
                      {step.detail}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-app-border bg-app-page-soft p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-app-text-muted">
                Confianza
              </span>
              <span className="font-mono text-xs text-app-text-soft">—</span>
            </div>

            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-app-track">
              <div className="h-full w-0 rounded-full bg-app-accent" />
            </div>

            <p className="mt-4 text-xs leading-5 text-app-text-muted">
              Mediremos cuánto confías en cada decisión para comparar seguridad y precisión con el tiempo.
            </p>

            <button
              className="mt-5 min-h-11 w-full cursor-not-allowed rounded-xl bg-app-accent px-4 text-sm font-semibold text-app-accent-text opacity-45"
              disabled
              type="button"
            >
              Confirmar decisión
            </button>
          </article>
        </aside>
      </section>

      <section className="mt-4 grid gap-3 md:grid-cols-4">
        {sessionSteps.map((step) => (
          <article
            className="rounded-2xl border border-app-border bg-app-surface-subtle p-4"
            key={step.number}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] text-app-text-muted">
                {step.number}
              </span>
              <span className="size-1.5 rounded-full bg-app-border-strong" />
            </div>
            <h3 className="mt-5 text-sm font-medium text-app-text">
              {step.label}
            </h3>
            <p className="mt-2 text-[11px] leading-5 text-app-text-muted">
              {step.detail}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
