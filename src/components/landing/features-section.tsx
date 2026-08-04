const features = [
  {
    number: "01",
    title: "Autenticación preparada",
    description:
      "Acceso con Google, sesiones seguras y protección de rutas privadas mediante Supabase.",
  },
  {
    number: "02",
    title: "Pagos y suscripciones",
    description:
      "Planes Free, Plus y Premium con Stripe Checkout, webhooks y portal de facturación.",
  },
  {
    number: "03",
    title: "Datos por usuario",
    description:
      "Perfiles y datos privados en PostgreSQL, protegidos con políticas de seguridad por usuario.",
  },
  {
    number: "04",
    title: "Diseño reutilizable",
    description:
      "Componentes consistentes y cuatro presets visuales que pueden adaptarse a cada nueva marca.",
  },
];

export function FeaturesSection() {
  return (
    <section className="section section-light" id="base">
      <div className="container">
        <div className="section-heading">
          <div>
            <span className="section-kicker">LA BASE</span>

            <h2>Lo repetitivo, construido una sola vez.</h2>
          </div>

          <p>
            Cada idea comienza con una infraestructura sólida. Así podemos
            concentrar el esfuerzo en el producto sin reconstruir siempre las
            mismas piezas.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature) => (
            <article
              className="feature-card"
              key={feature.number}
            >
              <div className="feature-number">
                {feature.number}
              </div>

              <div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>

              <span
                aria-hidden="true"
                className="feature-arrow"
              >
                ↗
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}