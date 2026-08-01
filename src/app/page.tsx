import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";

const features = [
  {
    number: "01",
    title: "Autenticación preparada",
    description:
      "Una base diseñada para incorporar cuentas de usuario, acceso con Google y protección de rutas privadas.",
  },
  {
    number: "02",
    title: "Pagos y suscripciones",
    description:
      "Estructura pensada para añadir planes Free y Pro, pagos recurrentes y gestión de facturación.",
  },
  {
    number: "03",
    title: "Datos por usuario",
    description:
      "Cada producto podrá almacenar información privada asociada de forma segura a cada cuenta.",
  },
  {
    number: "04",
    title: "Diseño reutilizable",
    description:
      "Componentes visuales consistentes que podremos adaptar rápidamente a diferentes ideas de negocio.",
  },
];

const steps = [
  {
    number: "01",
    title: "Partimos de la plantilla",
    description:
      "La infraestructura común ya contiene la web pública, el panel privado y la estructura del producto.",
  },
  {
    number: "02",
    title: "Añadimos la idea",
    description:
      "Construimos únicamente la funcionalidad específica del nuevo negocio, sin repetir todo lo anterior.",
  },
  {
    number: "03",
    title: "Publicamos",
    description:
      "Conectamos dominio, producción y pagos cuando el producto está preparado para recibir usuarios.",
  },
];

export default function Home() {
  return (
    <main>
      <SiteHeader />

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

      <section className="section section-light" id="base">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="section-kicker">LA BASE</span>
              <h2>Lo repetitivo, construido una sola vez.</h2>
            </div>

            <p>
              Cada idea empezará con una infraestructura sólida. Así podremos
              concentrar el esfuerzo en el producto y no en reconstruir siempre
              las mismas piezas.
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature) => (
              <article className="feature-card" key={feature.number}>
                <div className="feature-number">{feature.number}</div>
                <div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
                <span className="feature-arrow" aria-hidden="true">
                  ↗
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-process" id="proceso">
        <div className="container process-layout">
          <div className="process-introduction">
            <span className="section-kicker section-kicker-dark">PROCESO</span>
            <h2>De una idea a una aplicación funcional.</h2>
            <p>
              La plantilla reduce el número de decisiones y tareas repetidas.
              Cada nuevo proyecto comienza varios pasos por delante.
            </p>
          </div>

          <div className="steps-list">
            {steps.map((step) => (
              <article className="step-item" key={step.number}>
                <span>{step.number}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-pricing" id="planes">
        <div className="container">
          <div className="pricing-heading">
            <span className="section-kicker">PLANES</span>
            <h2>Una base preparada para monetizar.</h2>
            <p>
              Estos botones todavía no realizan pagos. Más adelante los
              conectaremos con Stripe en un entorno de pruebas.
            </p>
          </div>

          <div className="pricing-grid">
            <article className="pricing-card">
              <div>
                <span className="plan-name">Free</span>
                <p>Para probar el producto y conocer sus funciones.</p>
              </div>

              <div className="price">
                <strong>€0</strong>
                <span>/ siempre</span>
              </div>

              <ul>
                <li>Cuenta de usuario</li>
                <li>Panel personal</li>
                <li>Funcionalidades básicas</li>
              </ul>

              <button className="button button-outline-full" type="button">
                Crear cuenta
              </button>
            </article>

            <article className="pricing-card pricing-card-featured">
              <div className="popular-label">RECOMENDADO</div>

              <div>
                <span className="plan-name">Pro</span>
                <p>Para usuarios que necesitan todo el potencial del producto.</p>
              </div>

              <div className="price">
                <strong>€19</strong>
                <span>/ mes</span>
              </div>

              <ul>
                <li>Todo lo incluido en Free</li>
                <li>Funciones avanzadas</li>
                <li>Mayor capacidad de uso</li>
              </ul>

              <button className="button button-light-full" type="button">
                Empezar con Pro
              </button>
            </article>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}