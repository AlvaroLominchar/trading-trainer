export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-content">
        <a className="brand" href="#inicio" aria-label="Ir al inicio">
          <span className="brand-mark">B</span>
          <span>Base</span>
        </a>

        <nav className="desktop-navigation" aria-label="Navegación principal">
          <a href="#base">La base</a>
          <a href="#proceso">Proceso</a>
          <a href="#planes">Planes</a>
        </nav>

        <div className="header-actions">
          <a className="button button-ghost header-login" href="#planes">
            Acceder
          </a>

          <a className="button button-light button-small" href="#planes">
            Empezar
          </a>
        </div>
      </div>
    </header>
  );
}