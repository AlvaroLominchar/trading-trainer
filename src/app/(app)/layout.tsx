import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    default: "Aplicación",
    template: "%s | Base",
  },
};

type AppLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-col border-r border-white/10 bg-[#0a0a0a] p-5 lg:flex">
          <Link
            className="flex items-center gap-3 px-2 py-2"
            href="/dashboard"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-white text-sm font-extrabold text-black">
              B
            </span>

            <div>
              <span className="block text-sm font-semibold">Base</span>
              <span className="block text-[10px] uppercase tracking-[0.16em] text-neutral-600">
                Aplicación
              </span>
            </div>
          </Link>

          <nav
            className="mt-10 flex flex-col gap-2"
            aria-label="Navegación de la aplicación"
          >
            <Link
              className="flex min-h-11 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 text-sm text-neutral-200 transition hover:bg-white/10"
              href="/dashboard"
            >
              <span className="size-1.5 rounded-full bg-white" />
              Dashboard
            </Link>

            <Link
              className="flex min-h-11 items-center gap-3 rounded-xl px-4 text-sm text-neutral-500 transition hover:bg-white/[0.06] hover:text-white"
              href="/settings"
            >
              <span className="size-1.5 rounded-full bg-neutral-700" />
              Configuración
            </Link>
          </nav>

          <div className="mt-auto">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-600">
                Plan actual
              </span>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-medium">Free</span>

                <span className="rounded-full border border-white/10 px-2 py-1 text-[9px] text-neutral-500">
                  DEMO
                </span>
              </div>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-1/3 rounded-full bg-white" />
              </div>

              <p className="mt-3 text-xs leading-5 text-neutral-600">
                Los límites reales se añadirán más adelante.
              </p>
            </div>

            <Link
              className="mt-4 flex min-h-10 items-center justify-center rounded-xl text-xs text-neutral-600 transition hover:bg-white/[0.04] hover:text-white"
              href="/login"
            >
              Salir de la demostración
            </Link>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="flex min-h-16 items-center justify-between border-b border-white/10 bg-[#090909] px-5 lg:hidden">
            <Link
              className="flex items-center gap-3 font-semibold"
              href="/dashboard"
            >
              <span className="grid size-8 place-items-center rounded-lg bg-white text-xs font-extrabold text-black">
                B
              </span>
              Base
            </Link>

            <Link
              className="rounded-lg border border-white/10 px-3 py-2 text-xs text-neutral-400"
              href="/settings"
            >
              Configuración
            </Link>
          </header>

          {children}
        </div>
      </div>
    </div>
  );
}