import type { Metadata } from "next";
import Link from "next/link";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export const metadata: Metadata = {
  title: "Acceder",
  description: "Accede a tu cuenta mediante Google.",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8">
        <header className="flex items-center justify-between">
          <Link className="flex items-center gap-3" href="/">
            <span className="grid size-9 place-items-center rounded-xl bg-white text-sm font-extrabold text-black">
              B
            </span>

            <span className="text-sm font-semibold">Base</span>
          </Link>

          <Link
            className="text-xs text-neutral-500 transition hover:text-white"
            href="/"
          >
            Volver a la web
          </Link>
        </header>

        <section className="flex flex-1 items-center justify-center py-16">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-600">
                Acceso
              </span>

              <h1 className="mt-4 text-4xl font-medium tracking-[-0.055em]">
                Bienvenido de nuevo.
              </h1>

              <p className="mt-4 text-sm leading-6 text-neutral-500">
                Accede con tu cuenta de Google para entrar en la aplicación.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black sm:p-8">
              <div className="mb-6 inline-flex rounded-full border border-white/10 px-3 py-2 text-[9px] uppercase tracking-[0.14em] text-neutral-500">
                Acceso seguro
              </div>

              <GoogleSignInButton />

              <p className="mt-6 text-center text-xs leading-5 text-neutral-700">
                Al continuar, Google compartirá con la aplicación tu nombre,
                correo electrónico e imagen de perfil.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}