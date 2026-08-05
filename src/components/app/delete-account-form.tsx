"use client";

import { useActionState, useState } from "react";

import {
  deleteAccount,
  type DeleteAccountState,
} from "@/app/(app)/settings/actions";

const DELETE_CONFIRMATION = "ELIMINAR";

const initialState: DeleteAccountState = {
  status: "idle",
  message: "",
};

export function DeleteAccountForm() {
  const [confirmation, setConfirmation] =
    useState("");

  const [state, formAction, isPending] =
    useActionState(
      deleteAccount,
      initialState,
    );

  const confirmationMatches =
    confirmation === DELETE_CONFIRMATION;

  return (
    <form
      action={formAction}
      className="mt-6 max-w-xl"
    >
      <label
        className="block text-xs font-medium text-app-text-soft"
        htmlFor="delete-account-confirmation"
      >
        Escribe{" "}
        <span className="font-mono text-app-danger">
          {DELETE_CONFIRMATION}
        </span>{" "}
        para confirmar
      </label>

      <input
        autoComplete="off"
        className="mt-3 min-h-11 w-full rounded-xl border border-app-border bg-app-page px-4 text-sm text-app-text outline-none transition placeholder:text-app-text-muted focus:border-app-border-strong"
        id="delete-account-confirmation"
        name="confirmation"
        onChange={(event) =>
          setConfirmation(event.target.value)
        }
        placeholder={DELETE_CONFIRMATION}
        spellCheck={false}
        type="text"
        value={confirmation}
      />

      <button
        className="mt-4 min-h-10 rounded-xl border border-app-border-strong px-4 text-xs font-semibold text-app-danger transition hover:bg-app-surface-active disabled:cursor-not-allowed disabled:opacity-50"
        disabled={
          isPending || !confirmationMatches
        }
        type="submit"
      >
        {isPending
          ? "Eliminando cuenta..."
          : "Eliminar cuenta definitivamente"}
      </button>

      {state.message ? (
        <p
          aria-live="polite"
          className="mt-3 text-xs leading-5 text-app-danger"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
