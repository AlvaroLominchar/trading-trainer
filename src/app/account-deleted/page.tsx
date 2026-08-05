import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cuenta eliminada",
  description:
    "La cuenta se ha eliminado correctamente.",
};

export default function AccountDeletedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-app-page px-5 py-16 text-app-text">
      <section className="w-full max-w-lg rounded-2xl border border-app-border bg-app-surface-subtle p-7 sm:p-10">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-app-text-muted">
          Cuenta
        </span>

        <h1 className="mt-4 text-3xl font-medium tracking-[-0.045em]">
          Cuenta eliminada
        </h1>

        <p className="mt-4 text-sm leading-6 text-app-text-soft">
          La cuenta, el perfil y la suscripción asociada
          se han eliminado correctamente.
        </p>

        <Link
          className="mt-7 inline-flex min-h-10 items-center justify-center rounded-xl bg-app-accent px-4 text-xs font-semibold text-app-accent-text transition hover:bg-app-accent-hover"
          href="/"
        >
          Volver al inicio
        </Link>
      </section>
    </main>
  );
}
