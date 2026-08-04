import Link from "next/link";

const plans = [
  {
    name: "Free",
    description:
      "Para probar el producto y conocer su propuesta principal.",
    price: "€0",
    period: "/ siempre",
    features: [
      "Cuenta de usuario",
      "Panel personal",
      "Acceso al nivel gratuito",
    ],
    buttonLabel: "Empezar gratis",
    featured: false,
  },
  {
    name: "Plus",
    description:
      "El nivel intermedio para quienes necesitan más capacidad.",
    price: "€4,99",
    period: "/ mes",
    features: [
      "Todo lo incluido en Free",
      "Capacidades ampliadas",
      "Gestión de suscripción",
    ],
    buttonLabel: "Elegir Plus",
    featured: false,
  },
  {
    name: "Premium",
    description:
      "El nivel completo para aprovechar todo el potencial del producto.",
    price: "€19,99",
    period: "/ mes",
    features: [
      "Todo lo incluido en Plus",
      "Nivel máximo de capacidad",
      "Acceso a funciones premium",
    ],
    buttonLabel: "Elegir Premium",
    featured: true,
  },
] as const;

export function PricingSection() {
  return (
    <section
      className="section section-pricing"
      id="planes"
    >
      <div className="container">
        <div className="pricing-heading">
          <span className="section-kicker">PLANES</span>

          <h2>Tres niveles listos para cada producto.</h2>

          <p>
            La plantilla integra Free, Plus y Premium con facturación mensual.
            Las capacidades concretas de cada nivel se personalizan para cada
            negocio.
          </p>
        </div>

        <div className="pricing-grid">
          {plans.map((plan) => (
            <article
              className={`pricing-card ${
                plan.featured
                  ? "pricing-card-featured"
                  : ""
              }`}
              key={plan.name}
            >
              {plan.featured ? (
                <div className="popular-label">
                  RECOMENDADO
                </div>
              ) : null}

              <div>
                <span className="plan-name">
                  {plan.name}
                </span>

                <p>{plan.description}</p>
              </div>

              <div className="price">
                <strong>{plan.price}</strong>
                <span>{plan.period}</span>
              </div>

              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>

              <Link
                className={`button ${
                  plan.featured
                    ? "button-light-full"
                    : "button-outline-full"
                }`}
                href="/login"
              >
                {plan.buttonLabel}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}