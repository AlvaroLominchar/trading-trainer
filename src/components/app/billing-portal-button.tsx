"use client";

import { useActionState } from "react";

import {
  createBillingPortalSession,
  type CreateBillingPortalState,
} from "@/app/(app)/settings/actions";

const initialState: CreateBillingPortalState = {
  status: "idle",
  message: "",
};

type BillingPortalButtonProps = {
  label?: string;
};

export function BillingPortalButton({
  label = "Gestionar suscripción",
}: BillingPortalButtonProps) {
  const [state, formAction, isPending] = useActionState(
    createBillingPortalSession,
    initialState,
  );

  return (
    <form action={formAction}>
      <button
        className="min-h-10 rounded-xl bg-app-accent px-4 text-xs font-semibold text-app-accent-text transition hover:bg-app-accent-hover disabled:cursor-wait disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Abriendo..." : label}
      </button>

      {state.message ? (
        <p
          aria-live="polite"
          className="mt-3 max-w-xs text-xs leading-5 text-app-danger sm:text-right"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
