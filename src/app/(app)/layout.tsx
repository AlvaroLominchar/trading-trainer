import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppNavigation } from "@/components/app/app-navigation";
import { UserAvatar } from "@/components/app/user-avatar";
import { getCurrentProfile } from "@/lib/auth/current-profile";

export const metadata: Metadata = {
  title: {
    default: "Aplicación",
    template: "%s | Base",
  },
};

type AppLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function AppLayout({
  children,
}: AppLayoutProps) {
  const currentProfile = await getCurrentProfile();

  if (!currentProfile) {
    redirect("/login");
  }

  const { profile } = currentProfile;

  const planLabel =
    profile.plan === "premium"
      ? "Premium"
      : profile.plan === "plus"
        ? "Plus"
        : "Free";

  const planProgressWidth =
    profile.plan === "premium"
      ? "w-full"
      : profile.plan === "plus"
        ? "w-2/3"
        : "w-1/3";

  return (
    <div className="min-h-screen bg-app-page text-app-text">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-col border-r border-app-border bg-app-page-soft p-5 lg:flex">
          <Link
            className="flex items-center gap-3 px-2 py-2"
            href="/dashboard"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-app-accent text-sm font-extrabold text-app-accent-text">
              B
            </span>

            <div>
              <span className="block text-sm font-semibold">
                Base
              </span>

              <span className="block text-[10px] uppercase tracking-[0.16em] text-app-text-muted">
                Aplicación
              </span>
            </div>
          </Link>

          <AppNavigation />

          <div className="mt-auto">
            <div className="rounded-2xl border border-app-border bg-app-surface-subtle p-3">
              <div className="flex min-w-0 items-center gap-3">
                <UserAvatar
                  alt={`Avatar de ${profile.displayName}`}
                  avatarUrl={profile.avatarUrl}
                  initial={profile.initial}
                  size={40}
                />

                <div className="min-w-0">
                  <span className="block truncate text-sm font-medium text-app-text">
                    {profile.displayName}
                  </span>

                  <span className="mt-1 block truncate text-[10px] text-app-text-muted">
                    {profile.email}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-app-border bg-app-surface-subtle p-4">
              <span className="text-[10px] uppercase tracking-[0.16em] text-app-text-muted">
                Plan actual
              </span>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-medium">
                  {planLabel}
                </span>

                <span className="rounded-full border border-app-border px-2 py-1 text-[9px] text-app-text-soft">
                  DEMO
                </span>
              </div>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-app-track">
                <div
                  className={`h-full rounded-full bg-app-accent ${planProgressWidth}`}
                />
              </div>

              <p className="mt-3 text-xs leading-5 text-app-text-muted">
                Los límites reales se añadirán más adelante.
              </p>
            </div>

            <form action="/auth/signout" method="post">
              <button
                className="mt-4 flex min-h-10 w-full cursor-pointer items-center justify-center rounded-xl text-xs text-app-text-muted transition hover:bg-app-surface-subtle hover:text-app-text"
                type="submit"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="flex min-h-16 items-center justify-between border-b border-app-border bg-app-page-soft px-5 lg:hidden">
            <Link
              className="flex items-center gap-3 font-semibold"
              href="/dashboard"
            >
              <span className="grid size-8 place-items-center rounded-lg bg-app-accent text-xs font-extrabold text-app-accent-text">
                B
              </span>

              Base
            </Link>

            <div className="flex items-center gap-2">
              <UserAvatar
                alt={`Avatar de ${profile.displayName}`}
                avatarUrl={profile.avatarUrl}
                initial={profile.initial}
                size={30}
              />

              <Link
                className="rounded-lg border border-app-border px-3 py-2 text-xs text-app-text-soft"
                href="/settings"
              >
                Configuración
              </Link>

              <form action="/auth/signout" method="post">
                <button
                  className="rounded-lg border border-app-border px-3 py-2 text-xs text-app-text-muted transition hover:bg-app-surface-subtle hover:text-app-text"
                  type="submit"
                >
                  Salir
                </button>
              </form>
            </div>
          </header>

          {children}
        </div>
      </div>
    </div>
  );
}