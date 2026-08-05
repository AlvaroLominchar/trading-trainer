import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Acceder",
  description: "Accede a tu cuenta mediante Google.",
};

export default async function LoginPage() {
  const supabase = await createClient();

  const { data: claimsData } =
    await supabase.auth.getClaims();

  if (claimsData?.claims) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-app-page text-app-text">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8">
        <header className="flex items-center justify-between">
          <Link
            className="flex items-center gap-3"
            href="/"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-app-accent text-sm font-extrabold text-app-accent-text">
              B
            </span>

            <span className="text-sm font-semibold">
              Base
            </span>
          </Link>

          <Link
            className="text-xs text-app-text-muted transition hover:text-app-text"
            href="/"
          >
            Volver a la web
          </Link>
        </header>

        <section className="flex flex-1 items-center justify-center py-16">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-app-text-muted">
                Acceso
              </span>

              <h1 className="mt-4 text-4xl font-medium tracking-[-0.055em] text-app-text">
                Bienvenido de nuevo.
              </h1>

              <p className="mt-4 text-sm leading-6 text-app-text-soft">
                Accede con tu cuenta de Google para entrar
                en la aplicación.
              </p>
            </div>

            <div className="rounded-[28px] border border-app-border bg-app-surface-subtle p-6 shadow-2xl sm:p-8">
              <div className="mb-6 inline-flex rounded-full border border-app-border px-3 py-2 text-[9px] uppercase tracking-[0.14em] text-app-text-soft">
                Acceso seguro
              </div>

              <GoogleSignInButton />

              <p className="mt-6 text-center text-xs leading-5 text-app-text-muted">
                Al continuar, Google compartirá con la
                aplicación tu nombre, correo electrónico e
                imagen de perfil.
              </p>

              <p className="mt-4 text-center text-[11px] leading-5 text-app-text-muted">
                Al acceder aceptas los{" "}
                <Link
                  className="text-app-text underline underline-offset-4"
                  href="/terms"
                >
                  términos
                </Link>{" "}
                y confirmas que has leído la{" "}
                <Link
                  className="text-app-text underline underline-offset-4"
                  href="/privacy"
                >
                  política de privacidad
                </Link>
                .
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
