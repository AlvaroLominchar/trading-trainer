"use client";

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
  "Tu acceso con Google está conectado.",
  "Puedes editar tu perfil desde Configuración.",
  "La facturación está preparada para Free, Plus y Premium.",
];

export function OnboardingCard({
  firstName,
}: OnboardingCardProps) {
  const [state, formAction, isPending] =
    useActionState(
      completeOnboarding,
      initialState,
    );

  return (
    <section className="mt-8 rounded-2xl border border-app-border-strong bg-app-surface-active p-6 sm:p-8">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-app-text-muted">
            Primeros pasos
          </span>

          <h2 className="mt-3 text-2xl font-medium tracking-[-0.04em] text-app-text">
            Bienvenido, {firstName}
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-app-text-soft">
            La cuenta ya está preparada. Esta bienvenida
            es genérica para que cada producto pueda
            sustituirla por sus propios primeros pasos.
          </p>

          <ul className="mt-5 space-y-3">
            {onboardingItems.map((item) => (
              <li
                className="flex items-start gap-3 text-xs leading-5 text-app-text-muted"
                key={item}
              >
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-app-accent" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <form
          action={formAction}
          className="shrink-0"
        >
          <button
            className="min-h-11 rounded-xl bg-app-accent px-5 text-sm font-semibold text-app-accent-text transition hover:bg-app-accent-hover disabled:cursor-wait disabled:opacity-60"
            disabled={isPending}
            type="submit"
          >
            {isPending
              ? "Preparando..."
              : "Empezar a usar la aplicación"}
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
    </section>
  );
}
