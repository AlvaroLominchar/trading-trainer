import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Error de acceso",
  description: "No se pudo completar el inicio de sesión.",
};

export default function AuthCodeErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] px-5 text-white">
      <section className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/[0.035] p-8 text-center shadow-2xl shadow-black">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-600">
          Autenticación
        </span>

        <h1 className="mt-4 text-3xl font-medium tracking-[-0.05em]">
          No se pudo completar el acceso.
        </h1>

        <p className="mt-4 text-sm leading-6 text-neutral-500">
          La sesión no pudo validarse. Puedes volver a la página de acceso e
          intentarlo de nuevo.
        </p>

        <Link
          className="mt-8 flex min-h-12 w-full items-center justify-center rounded-xl bg-white text-sm font-semibold text-black transition hover:bg-neutral-200"
          href="/login"
        >
          Volver a iniciar sesión
        </Link>
      </section>
    </main>
  );
}