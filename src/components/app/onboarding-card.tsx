"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  completeOnboarding,
  type CompleteOnboardingState,
} from "@/app/(app)/dashboard/actions";

const initialState: CompleteOnboardingState = {
  status: "idle",
  message: "",
};

type OnboardingCardProps = {
  firstName: string;
};

const onboardingItems = [
  "Entrenarás con escenarios históricos o controlados, no con señales en tiempo real.",
  "No operar será una decisión válida cuando el contexto no justifique una entrada.",
  "Tu progreso se medirá por habilidades y proceso, no solo por el resultado final.",
];

export function OnboardingCard({
  firstName,
}: OnboardingCardProps) {
  const [state, formAction, isPending] = useActionState(
    completeOnboarding,
    initialState,
  );

  return (
    <section className="relative mt-8 overflow-hidden rounded-3xl border border-app-border-strong bg-app-surface-active p-6 sm:p-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-app-accent opacity-[0.05] blur-3xl"
      />

      <div className="relative flex flex-col justify-between gap-7 xl:flex-row xl:items-center">
        <div className="max-w-3xl">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-app-text-muted">
            Primeros pasos
          </span>

          <h2 className="mt-3 text-2xl font-medium tracking-[-0.04em] text-app-text sm:text-3xl">
            Tu gimnasio de decisiones está preparado, {firstName}
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-app-text-soft">
            Antes de medir rendimiento real vamos a construir una base: leer contexto, decidir con intención y aprender del proceso.
          </p>

          <ul className="mt-5 grid gap-3 md:grid-cols-3">
            {onboardingItems.map((item, index) => (
              <li
                className="rounded-2xl border border-app-border bg-app-page-soft/60 p-4 text-xs leading-5 text-app-text-muted"
                key={item}
              >
                <span className="mb-3 grid size-6 place-items-center rounded-full bg-app-accent font-mono text-[9px] font-bold text-app-accent-text">
                  0{index + 1}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row xl:flex-col">
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-app-border px-5 text-sm font-medium text-app-text transition hover:bg-app-surface-hover"
            href="/train"
          >
            Ver entrenamiento
          </Link>

          <form action={formAction}>
            <button
              className="min-h-11 w-full rounded-xl bg-app-accent px-5 text-sm font-semibold text-app-accent-text transition hover:bg-app-accent-hover disabled:cursor-wait disabled:opacity-60"
              disabled={isPending}
              type="submit"
            >
              {isPending ? "Preparando..." : "Entendido"}
            </button>

            {state.message ? (
              <p
                aria-live="polite"
                className="mt-3 max-w-xs text-xs leading-5 text-app-danger"
                role="alert"
              >
                {state.message}
              </p>
            ) : null}
          </form>
        </div>
      </div>
    </section>
  );
}
