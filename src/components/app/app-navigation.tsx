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
                ? "border-white/10 bg-white/[0.06] text-neutral-200 hover:bg-white/10"
                : "border-transparent text-neutral-500 hover:bg-white/[0.06] hover:text-white"
            }`}
            href={item.href}
            key={item.href}
          >
            <span
              className={`size-1.5 rounded-full ${
                isActive
                  ? "bg-white"
                  : "bg-neutral-700"
              }`}
            />

            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}