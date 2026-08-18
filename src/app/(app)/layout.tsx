import Link from "next/link";
import { redirect } from "next/navigation";

import { AppNavigation } from "@/components/app/app-navigation";
import { UserAvatar } from "@/components/app/user-avatar";
import { getPlanLabel } from "@/config/plans";
import { getCurrentProfile } from "@/lib/auth/current-profile";


type AppLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`relative grid shrink-0 place-items-center overflow-hidden bg-app-accent font-mono font-bold tracking-[-0.08em] text-app-accent-text ${
        compact ? "size-8 rounded-lg text-[10px]" : "size-10 rounded-xl text-xs"
      }`}
    >
      <span className="relative z-10">TT</span>
      <span className="absolute -right-2 -top-2 size-5 rounded-full border border-current opacity-20" />
      <span className="absolute -bottom-2 -left-2 size-5 rounded-full border border-current opacity-20" />
    </span>
  );
}

export default async function AppLayout({
  children,
}: AppLayoutProps) {
  const currentProfile = await getCurrentProfile();

  if (!currentProfile) {
    redirect("/login");
  }

  const { profile } = currentProfile;
  const planLabel = getPlanLabel(profile.plan);

  return (
    <div className="min-h-screen bg-app-page text-app-text">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-[272px] shrink-0 flex-col border-r border-app-border bg-app-page-soft p-5 lg:flex">
          <Link
            className="group flex items-center gap-3 rounded-xl px-2 py-2"
            href="/dashboard"
          >
            <BrandMark />

            <div className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-[-0.02em] text-app-text">
                Trading Trainer
              </span>
              <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.15em] text-app-text-muted">
                Decision gym
              </span>
            </div>
          </Link>

          <AppNavigation />

          <div className="mt-auto space-y-3">
            <Link
              className="block rounded-2xl border border-app-border bg-app-surface-subtle p-4 transition duration-200 hover:border-app-border-strong hover:bg-app-surface-hover"
              href="/settings"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-app-text-muted">
                  Plan actual
                </span>
                <span className="rounded-full border border-app-border px-2 py-1 text-[9px] text-app-text-soft">
                  {planLabel}
                </span>
              </div>
              <p className="mt-3 text-xs leading-5 text-app-text-muted">
                Gestiona tu cuenta, apariencia y facturación.
              </p>
            </Link>

            <div className="rounded-2xl border border-app-border bg-app-surface-subtle p-3">
              <div className="flex min-w-0 items-center gap-3">
                <UserAvatar
                  alt={`Avatar de ${profile.displayName}`}
                  avatarUrl={profile.avatarUrl}
                  initial={profile.initial}
                  size={40}
                />

                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-app-text">
                    {profile.displayName}
                  </span>
                  <span className="mt-1 block truncate text-[10px] text-app-text-muted">
                    {profile.email}
                  </span>
                </div>
              </div>

              <form action="/auth/signout" method="post">
                <button
                  className="mt-3 min-h-9 w-full cursor-pointer rounded-lg border border-app-border text-[11px] text-app-text-muted transition duration-200 hover:bg-app-surface-hover hover:text-app-text"
                  type="submit"
                >
                  Cerrar sesión
                </button>
              </form>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 pb-20 lg:pb-0">
          <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-app-border bg-app-page-soft/90 px-5 backdrop-blur-xl lg:hidden">
            <Link
              className="flex items-center gap-2.5"
              href="/dashboard"
            >
              <BrandMark compact />
              <span className="text-sm font-semibold tracking-[-0.02em]">
                Trading Trainer
              </span>
            </Link>

            <Link
              aria-label="Abrir configuración"
              className="rounded-full border border-app-border p-0.5 transition hover:border-app-border-strong"
              href="/settings"
            >
              <UserAvatar
                alt={`Avatar de ${profile.displayName}`}
                avatarUrl={profile.avatarUrl}
                initial={profile.initial}
                size={30}
              />
            </Link>
          </header>

          {children}
        </div>
      </div>

      <AppNavigation variant="mobile" />
    </div>
  );
}
