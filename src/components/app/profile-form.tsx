"use client";

import { useActionState } from "react";

import {
  updateProfile,
  type UpdateProfileState,
} from "@/app/(app)/settings/actions";

const initialState: UpdateProfileState = {
  status: "idle",
  message: "",
};

type ProfileFormProps = {
  email: string;
  fullName: string;
};

export function ProfileForm({
  email,
  fullName,
}: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateProfile,
    initialState,
  );

  return (
    <form action={formAction}>
      <div className="grid gap-6 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs text-app-text-soft">
            Nombre
          </span>

          <input
            autoComplete="name"
            className="min-h-12 w-full rounded-xl border border-app-border bg-app-page-soft px-4 text-sm text-app-text outline-none transition placeholder:text-app-text-muted focus:border-app-border-strong"
            defaultValue={fullName}
            maxLength={80}
            minLength={2}
            name="fullName"
            required
            type="text"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs text-app-text-soft">
            Correo electrónico
          </span>

          <input
            className="min-h-12 w-full cursor-not-allowed rounded-xl border border-app-border bg-app-page-soft px-4 text-sm text-app-text-muted outline-none"
            readOnly
            type="email"
            value={email}
          />
        </label>
      </div>

      <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          className="min-h-11 rounded-xl bg-app-accent px-5 text-sm font-semibold text-app-accent-text transition hover:bg-app-accent-hover disabled:cursor-wait disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {isPending
            ? "Guardando..."
            : "Guardar cambios"}
        </button>

        {state.message ? (
          <p
            aria-live="polite"
            className={`text-xs leading-5 ${
              state.status === "error"
                ? "text-app-danger"
                : "text-app-text-soft"
            }`}
            role={
              state.status === "error"
                ? "alert"
                : "status"
            }
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}