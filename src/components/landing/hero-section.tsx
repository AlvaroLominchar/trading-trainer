export function HeroSection() {
  return (
    <section className="hero-section" id="inicio">
      <div className="hero-background" aria-hidden="true" />

      <div className="container hero-grid">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            Infraestructura para tu próximo negocio
          </div>

          <h1>
            Convierte ideas en
            <span> productos reales.</span>
          </h1>

          <p className="hero-description">
            Una plantilla reutilizable con diseño, usuarios, datos y
            monetización preparada para construir nuevos negocios online sin
            empezar desde cero.
          </p>

          <div className="hero-actions">
            <a className="button button-light" href="#base">
              Explorar la plantilla
              <span aria-hidden="true">→</span>
            </a>

            <a className="button button-dark" href="#proceso">
              Ver cómo funciona
            </a>
          </div>

          <div className="hero-detail">
            <span>Next.js</span>
            <span className="separator" />
            <span>Supabase</span>
            <span className="separator" />
            <span>Stripe</span>
            <span className="separator" />
            <span>Vercel</span>
          </div>
        </div>

        <div className="product-preview" aria-label="Vista previa del panel">
          <div className="preview-glow" aria-hidden="true" />

          <div className="preview-window">
            <div className="preview-topbar">
              <div className="window-controls" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>

              <div className="preview-address">
                <span className="address-lock">◇</span>
                app.tuproducto.com
              </div>

              <div className="preview-avatar">A</div>
            </div>

            <div className="preview-body">
              <aside className="preview-sidebar">
                <div className="sidebar-logo">B</div>

                <div className="sidebar-items">
                  <span className="sidebar-item sidebar-item-active" />
                  <span className="sidebar-item" />
                  <span className="sidebar-item" />
                  <span className="sidebar-item sidebar-item-short" />
                </div>

                <span className="sidebar-item sidebar-item-bottom" />
              </aside>

              <div className="dashboard">
                <div className="dashboard-header">
                  <div>
                    <span className="dashboard-label">OVERVIEW</span>
                    <h2>Buenas tardes, Álvaro</h2>
                    <p>Todo está preparado para seguir construyendo.</p>
                  </div>

                  <button className="mock-button" type="button">
                    Nuevo proyecto
                  </button>
                </div>

                <div className="metric-grid">
                  <article className="metric-card">
                    <span>Proyectos</span>
                    <strong>04</strong>
                    <small>+1 este mes</small>
                  </article>

                  <article className="metric-card">
                    <span>Usuarios</span>
                    <strong>128</strong>
                    <small>+18,4 %</small>
                  </article>

                  <article className="metric-card">
                    <span>Ingresos</span>
                    <strong>€2.4k</strong>
                    <small>Últimos 30 días</small>
                  </article>
                </div>

                <div className="activity-card">
                  <div className="activity-heading">
                    <div>
                      <span>Actividad</span>
                      <strong>Crecimiento mensual</strong>
                    </div>

                    <span className="activity-period">12 meses</span>
                  </div>

                  <div className="chart" aria-hidden="true">
                    <div className="chart-grid">
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>

                    <svg
                      viewBox="0 0 600 180"
                      role="presentation"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient
                          id="chartFill"
                          x1="0"
                          x2="0"
                          y1="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="rgba(255,255,255,0.28)"
                          />
                          <stop
                            offset="100%"
                            stopColor="rgba(255,255,255,0)"
                          />
                        </linearGradient>
                      </defs>

                      <path
                        className="chart-area"
                        d="M0,153 C55,149 78,134 122,137 C172,141 190,105 239,112 C286,119 316,76 360,85 C409,94 426,54 476,61 C522,68 550,31 600,22 L600,180 L0,180 Z"
                      />

                      <path
                        className="chart-line"
                        d="M0,153 C55,149 78,134 122,137 C172,141 190,105 239,112 C286,119 316,76 360,85 C409,94 426,54 476,61 C522,68 550,31 600,22"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}