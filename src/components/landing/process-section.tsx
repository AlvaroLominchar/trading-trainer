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

export function ProcessSection() {
  return (
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
  );
}