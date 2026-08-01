import { HeroSection } from "@/components/landing/hero-section";
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

      <HeroSection />

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