import Link from "next/link";

const legalLinks = [
  {
    href: "/legal",
    label: "Aviso legal",
  },
  {
    href: "/privacy",
    label: "Privacidad",
  },
  {
    href: "/terms",
    label: "Términos",
  },
  {
    href: "/cookies",
    label: "Cookies",
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-app-border bg-app-page">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-10 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-10">
        <div>
          <Link
            className="inline-flex items-center gap-3"
            href="/"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-app-accent text-sm font-extrabold text-app-accent-text">
              B
            </span>

            <span className="text-sm font-semibold text-app-text">
              Base
            </span>
          </Link>

          <p className="mt-4 max-w-md text-xs leading-6 text-app-text-muted">
            Plantilla reutilizable para construir productos
            SaaS con autenticación, facturación y temas
            semánticos.
          </p>
        </div>

        <div className="flex flex-col gap-5 lg:items-end">
          <nav
            aria-label="Enlaces legales"
            className="flex flex-wrap gap-x-5 gap-y-3 text-xs text-app-text-muted"
          >
            {legalLinks.map((link) => (
              <Link
                className="transition hover:text-app-text"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <p className="text-xs text-app-text-muted">
            © {new Date().getFullYear()} Base SaaS.
          </p>
        </div>
      </div>
    </footer>
  );
}
