import type { Metadata } from "next";
import Link from "next/link";

import { LegalDocument } from "@/components/legal/legal-document";

export const metadata: Metadata = {
  title: "Privacidad",
  description:
    "Política de privacidad provisional de la aplicación.",
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      description="Resumen provisional del tratamiento de datos personales realizado por la aplicación."
      title="Política de privacidad"
    >
      <section>
        <h2>1. Responsable del tratamiento</h2>

        <p>
          Responsable:{" "}
          <strong>[NOMBRE LEGAL O RAZÓN SOCIAL]</strong>.
          Contacto de privacidad:{" "}
          <strong>[CORREO DE PRIVACIDAD]</strong>. Delegado
          de protección de datos, cuando proceda:{" "}
          <strong>[DATOS DEL DPD]</strong>.
        </p>
      </section>

      <section>
        <h2>2. Datos tratados</h2>

        <ul>
          <li>
            Nombre, correo electrónico e imagen de perfil
            facilitados al acceder con Google.
          </li>
          <li>
            Identificador interno de usuario, plan y estado
            del onboarding.
          </li>
          <li>
            Identificadores de cliente, suscripción y estado
            de facturación gestionados con Stripe.
          </li>
          <li>
            Cookies técnicas, datos de sesión y registros
            necesarios para seguridad y funcionamiento.
          </li>
          <li>
            <strong>
              [OTROS DATOS QUE AÑADA EL PRODUCTO]
            </strong>
            .
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Finalidades y base jurídica</h2>

        <p>
          Completa las finalidades reales y su base jurídica:
          creación y gestión de cuentas, prestación del
          servicio, facturación, prevención del fraude,
          soporte, obligaciones legales y comunicaciones.
        </p>

        <p>
          Base jurídica aplicable a cada finalidad:{" "}
          <strong>
            [CONTRATO, CONSENTIMIENTO, OBLIGACIÓN LEGAL O
            INTERÉS LEGÍTIMO]
          </strong>
          .
        </p>
      </section>

      <section>
        <h2>4. Proveedores</h2>

        <p>
          La arquitectura de la plantilla utiliza Supabase
          para autenticación y base de datos, Google como
          proveedor de acceso, Stripe para facturación y
          Vercel para alojamiento. El responsable debe
          revisar sus contratos, ubicaciones, transferencias
          internacionales y garantías antes de producción.
        </p>
      </section>

      <section>
        <h2>5. Conservación</h2>

        <p>
          Define periodos concretos para cuentas activas,
          facturación, obligaciones fiscales, copias de
          seguridad, incidencias y cuentas eliminadas:{" "}
          <strong>[PLAZOS DE CONSERVACIÓN]</strong>.
        </p>
      </section>

      <section>
        <h2>6. Derechos</h2>

        <p>
          Explica los derechos aplicables en la jurisdicción
          del producto y cómo ejercerlos. La aplicación
          permite editar el perfil y eliminar la cuenta
          desde Configuración, pero esto no sustituye todos
          los procedimientos legales que puedan resultar
          obligatorios.
        </p>

        <p>
          Canal para solicitudes:{" "}
          <strong>[CORREO O FORMULARIO]</strong>. Autoridad
          de control competente:{" "}
          <strong>[AUTORIDAD DE CONTROL]</strong>.
        </p>
      </section>

      <section>
        <h2>7. Cookies</h2>

        <p>
          Consulta la <Link href="/cookies">política de cookies</Link>.
        </p>
      </section>

      <section>
        <h2>8. Última actualización</h2>

        <p>
          <strong>[FECHA DE PUBLICACIÓN]</strong>.
        </p>
      </section>
    </LegalDocument>
  );
}
