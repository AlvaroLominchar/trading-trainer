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
  );
}