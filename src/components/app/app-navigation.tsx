"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
  },
  {
    href: "/settings",
    label: "Configuración",
  },
] as const;

function isActiveRoute(
  pathname: string,
  href: string,
) {
  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

export function AppNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación de la aplicación"
      className="mt-10 flex flex-col gap-2"
    >
      {navigationItems.map((item) => {
        const isActive = isActiveRoute(
          pathname,
          item.href,
        );

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-xl border px-4 text-sm transition ${
              isActive
                ? "border-app-border bg-app-surface-active text-app-text hover:bg-app-surface-hover"
                : "border-transparent text-app-text-muted hover:bg-app-surface-subtle hover:text-app-text"
            }`}
            href={item.href}
            key={item.href}
          >
            <span
              className={`size-1.5 rounded-full ${
                isActive
                  ? "bg-app-accent"
                  : "bg-app-text-muted"
              }`}
            />

            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}