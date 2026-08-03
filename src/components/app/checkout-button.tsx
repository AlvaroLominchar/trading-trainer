"use client";

import { useActionState } from "react";

import {
  createCheckoutSession,
  type CheckoutPlan,
  type CreateCheckoutState,
} from "@/app/(app)/settings/actions";

const initialState: CreateCheckoutState = {
  status: "idle",
  message: "",
};

type CheckoutButtonProps = {
  disabled?: boolean;
  label: string;
  plan: CheckoutPlan;
};

export function CheckoutButton({
  disabled = false,
  label,
  plan,
}: CheckoutButtonProps) {
  const [state, formAction, isPending] = useActionState(
    createCheckoutSession,
    initialState,
  );

  return (
    <form action={formAction}>
      <input
        name="plan"
        type="hidden"
        value={plan}
      />

      <button
        className="min-h-10 w-full rounded-xl bg-app-accent px-4 text-xs font-semibold text-app-accent-text transition hover:bg-app-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled || isPending}
        type="submit"
      >
        {isPending ? "Redirigiendo..." : label}
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
  );
}