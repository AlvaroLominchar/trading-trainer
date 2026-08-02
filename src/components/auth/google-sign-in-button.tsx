"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function GoogleSignInButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setIsLoading(true);
    setErrorMessage(null);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setErrorMessage(
        "No se pudo iniciar sesión con Google. Inténtalo de nuevo.",
      );
      setIsLoading(false);
    }
  }

  return (
    <div>
      <button
        className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-white text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-wait disabled:opacity-60"
        disabled={isLoading}
        onClick={handleGoogleSignIn}
        type="button"
      >
        <span className="grid size-6 place-items-center rounded-full border border-black/10 text-xs font-bold">
          G
        </span>

        {isLoading ? "Conectando con Google..." : "Continuar con Google"}
      </button>

      {errorMessage ? (
        <p
          aria-live="polite"
          className="mt-4 text-center text-xs leading-5 text-red-300"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}