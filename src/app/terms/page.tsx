import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal/legal-document";

export const metadata: Metadata = {
  title: "Términos",
  description:
    "Términos de servicio provisionales de la aplicación.",
};

export default function TermsPage() {
  return (
    <LegalDocument
      description="Condiciones provisionales que deben adaptarse al producto, su modelo de negocio y la jurisdicción aplicable."
      title="Términos de servicio"
    >
      <section>
        <h2>1. Aceptación</h2>

        <p>
          Al crear una cuenta o contratar un plan, el
          usuario acepta estos términos y la política de
          privacidad. Define aquí la edad mínima y la
          capacidad legal exigida:{" "}
          <strong>[REQUISITOS DEL USUARIO]</strong>.
        </p>
      </section>

      <section>
        <h2>2. Cuenta</h2>

        <p>
          El acceso se realiza mediante Google. El usuario
          es responsable de mantener segura su cuenta,
          facilitar información válida y comunicar accesos
          no autorizados.
        </p>
      </section>

      <section>
        <h2>3. Servicio</h2>

        <p>
          Describe las funciones incluidas, límites de uso,
          disponibilidad, soporte y cambios del producto:{" "}
          <strong>[DESCRIPCIÓN Y NIVELES DE SERVICIO]</strong>.
        </p>
      </section>

      <section>
        <h2>4. Planes y facturación</h2>

        <p>
          La plantilla admite Free, Plus y Premium con
          facturación recurrente para los planes de pago.
          Antes de producción debes definir precios finales,
          impuestos, moneda, fecha de cobro, renovaciones,
          pruebas gratuitas, cambios de plan y facturación
          proporcional.
        </p>

        <p>
          Condiciones comerciales definitivas:{" "}
          <strong>[CONDICIONES DE SUSCRIPCIÓN]</strong>.
        </p>
      </section>

      <section>
        <h2>5. Cancelación y reembolsos</h2>

        <p>
          La aplicación permite gestionar la suscripción
          mediante el portal de Stripe y eliminar la cuenta
          desde Configuración. Define los efectos exactos de
          la cancelación, el acceso hasta fin de periodo,
          reembolsos, desistimiento y excepciones exigidas
          por la normativa aplicable:{" "}
          <strong>[POLÍTICA DE CANCELACIÓN]</strong>.
        </p>
      </section>

      <section>
        <h2>6. Conductas prohibidas</h2>

        <p>
          Incluye las reglas específicas del producto. Como
          mínimo, prohíbe el fraude, abuso, acceso no
          autorizado, automatización perjudicial,
          distribución de malware y vulneración de derechos
          de terceros.
        </p>
      </section>

      <section>
        <h2>7. Suspensión y terminación</h2>

        <p>
          Define causas, avisos, plazos de subsanación,
          exportación de datos y consecuencias del cierre:
          <strong> [POLÍTICA DE SUSPENSIÓN]</strong>.
        </p>
      </section>

      <section>
        <h2>8. Responsabilidad y garantías</h2>

        <p>
          Adapta garantías, límites de responsabilidad,
          indemnizaciones y exclusiones a la legislación
          aplicable:{" "}
          <strong>[TEXTO DE RESPONSABILIDAD]</strong>.
        </p>
      </section>

      <section>
        <h2>9. Legislación aplicable</h2>

        <p>
          <strong>[LEGISLACIÓN, JURISDICCIÓN Y MECANISMO DE RESOLUCIÓN]</strong>.
        </p>
      </section>

      <section>
        <h2>10. Última actualización</h2>

        <p>
          <strong>[FECHA DE PUBLICACIÓN]</strong>.
        </p>
      </section>
    </LegalDocument>
  );
}
