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

export function BillingPortalButton() {
  const [state, formAction, isPending] = useActionState(
    createBillingPortalSession,
    initialState,
  );

  return (
    <form action={formAction}>
      <button
        className="min-h-10 rounded-xl bg-white px-4 text-xs font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-wait disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending
          ? "Abriendo..."
          : "Gestionar suscripción"}
      </button>

      {state.message ? (
        <p
          aria-live="polite"
          className="mt-3 max-w-xs text-xs leading-5 text-red-300 sm:text-right"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}