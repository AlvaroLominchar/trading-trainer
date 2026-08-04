import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Error de acceso",
  description:
    "No se pudo completar el inicio de sesión.",
};

export default function AuthCodeErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-app-page px-5 text-app-text">
      <section className="w-full max-w-md rounded-[28px] border border-app-border bg-app-surface-subtle p-8 text-center shadow-2xl">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-app-text-muted">
          Autenticación
        </span>

        <h1 className="mt-4 text-3xl font-medium tracking-[-0.05em] text-app-text">
          No se pudo completar el acceso.
        </h1>

        <p className="mt-4 text-sm leading-6 text-app-text-soft">
          La sesión no pudo validarse. Puedes volver a la
          página de acceso e intentarlo de nuevo.
        </p>

        <Link
          className="mt-8 flex min-h-12 w-full items-center justify-center rounded-xl bg-app-accent text-sm font-semibold text-app-accent-text transition hover:bg-app-accent-hover"
          href="/login"
        >
          Volver a iniciar sesión
        </Link>
      </section>
    </main>
  );
}