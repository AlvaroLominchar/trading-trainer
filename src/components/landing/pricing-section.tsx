export function PricingSection() {
  return (
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

              <p>
                Para usuarios que necesitan todo el potencial del producto.
              </p>
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
  );
}