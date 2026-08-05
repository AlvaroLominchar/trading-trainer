import Link from "next/link";
import type { ReactNode } from "react";

type LegalDocumentProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function LegalDocument({
  title,
  description,
  children,
}: LegalDocumentProps) {
  return (
    <main className="min-h-screen bg-app-page text-app-text">
      <div className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
        <header className="flex items-center justify-between gap-6">
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

        <article className="mt-12 rounded-[28px] border border-app-border bg-app-surface-subtle p-6 sm:p-10">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-app-text-muted">
            Documento provisional
          </span>

          <h1 className="mt-4 text-4xl font-medium tracking-[-0.055em] text-app-text sm:text-5xl">
            {title}
          </h1>

          <p className="mt-5 max-w-3xl text-sm leading-7 text-app-text-soft">
            {description}
          </p>

          <div className="mt-8 rounded-2xl border border-app-border bg-app-page-soft p-5 text-xs leading-6 text-app-text-soft">
            Sustituye todos los campos entre corchetes y
            revisa este documento con asesoramiento
            profesional antes de publicar un producto real.
            Esta plantilla no constituye asesoramiento
            legal.
          </div>

          <div className="mt-10 space-y-10 text-sm leading-7 text-app-text-soft [&_a]:text-app-text [&_a]:underline [&_a]:underline-offset-4 [&_h2]:text-xl [&_h2]:font-medium [&_h2]:tracking-[-0.025em] [&_h2]:text-app-text [&_li]:ml-5 [&_li]:list-disc [&_strong]:font-semibold [&_strong]:text-app-text">
            {children}
          </div>

          <footer className="mt-12 flex flex-wrap gap-x-5 gap-y-3 border-t border-app-border pt-6 text-xs text-app-text-muted">
            <Link href="/legal">Aviso legal</Link>
            <Link href="/privacy">Privacidad</Link>
            <Link href="/terms">Términos</Link>
            <Link href="/cookies">Cookies</Link>
          </footer>
        </article>
      </div>
    </main>
  );
}
