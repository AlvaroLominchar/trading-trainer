"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavigationIcon = "dashboard" | "train" | "settings";

type NavigationItem = {
  href: string;
  label: string;
  icon: NavigationIcon;
};

const navigationItems: readonly NavigationItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "dashboard",
  },
  {
    href: "/train",
    label: "Entrenar",
    icon: "train",
  },
  {
    href: "/settings",
    label: "Configuración",
    icon: "settings",
  },
];

function isActiveRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavigationIcon({ icon }: { icon: NavigationIcon }) {
  if (icon === "dashboard") {
    return (
      <svg
        aria-hidden="true"
        className="size-4"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.6"
        />
      </svg>
    );
  }

  if (icon === "train") {
    return (
      <svg
        aria-hidden="true"
        className="size-4"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          d="M5 18V9m4 6V5m4 13v-7m4 4V7m3 13H3"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.6"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 8.25A3.75 3.75 0 1 0 12 15.75 3.75 3.75 0 0 0 12 8.25Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M19.1 13.1c.05-.36.08-.73.08-1.1 0-.37-.03-.74-.08-1.1l2.02-1.58-1.92-3.32-2.38.96a8.33 8.33 0 0 0-1.9-1.1L14.56 3.3h-3.84l-.36 2.56c-.68.27-1.31.64-1.9 1.1L6.08 6 4.16 9.32l2.02 1.58A7.87 7.87 0 0 0 6.1 12c0 .37.03.74.08 1.1l-2.02 1.58L6.08 18l2.38-.96c.59.46 1.22.83 1.9 1.1l.36 2.56h3.84l.36-2.56c.68-.27 1.31-.64 1.9-1.1l2.38.96 1.92-3.32-2.02-1.58Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.35"
      />
    </svg>
  );
}

type AppNavigationProps = {
  variant?: "sidebar" | "mobile";
};

export function AppNavigation({
  variant = "sidebar",
}: AppNavigationProps) {
  const pathname = usePathname();

  if (variant === "mobile") {
    return (
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-3 gap-1 rounded-2xl border border-app-border bg-app-page-soft/95 p-1.5 shadow-2xl backdrop-blur-xl lg:hidden"
      >
        {navigationItems.map((item) => {
          const isActive = isActiveRoute(pathname, item.href);

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[10px] font-medium transition duration-200 ${
                isActive
                  ? "bg-app-surface-active text-app-text"
                  : "text-app-text-muted hover:bg-app-surface-subtle hover:text-app-text"
              }`}
              href={item.href}
              key={item.href}
            >
              <NavigationIcon icon={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      aria-label="Navegación principal"
      className="mt-9 flex flex-col gap-1.5"
    >
      {navigationItems.map((item) => {
        const isActive = isActiveRoute(pathname, item.href);

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={`group flex min-h-11 items-center gap-3 rounded-xl border px-3.5 text-sm transition duration-200 ${
              isActive
                ? "border-app-border bg-app-surface-active text-app-text"
                : "border-transparent text-app-text-muted hover:border-app-border hover:bg-app-surface-subtle hover:text-app-text"
            }`}
            href={item.href}
            key={item.href}
          >
            <span
              className={`grid size-8 place-items-center rounded-lg transition duration-200 ${
                isActive
                  ? "bg-app-accent text-app-accent-text"
                  : "bg-app-surface-subtle text-app-text-muted group-hover:text-app-text"
              }`}
            >
              <NavigationIcon icon={item.icon} />
            </span>

            <span>{item.label}</span>

            {item.href === "/train" ? (
              <span className="ml-auto rounded-full border border-app-border px-2 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-app-text-muted">
                Core
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
