import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal/legal-document";

export const metadata: Metadata = {
  title: "Aviso legal",
  description:
    "Información legal provisional de la aplicación.",
};

export default function LegalPage() {
  return (
    <LegalDocument
      description="Información identificativa y condiciones generales de acceso a esta aplicación."
      title="Aviso legal"
    >
      <section>
        <h2>1. Titular del servicio</h2>

        <p>
          El titular de esta aplicación es{" "}
          <strong>[NOMBRE LEGAL O RAZÓN SOCIAL]</strong>,
          con NIF/CIF{" "}
          <strong>[IDENTIFICADOR FISCAL]</strong> y
          domicilio en <strong>[DOMICILIO COMPLETO]</strong>.
        </p>

        <p>
          Contacto:{" "}
          <strong>[CORREO ELECTRÓNICO LEGAL]</strong>.
          Datos registrales, cuando proceda:{" "}
          <strong>[REGISTRO, TOMO, FOLIO Y HOJA]</strong>.
        </p>
      </section>

      <section>
        <h2>2. Objeto</h2>

        <p>
          Este sitio proporciona acceso a{" "}
          <strong>[DESCRIPCIÓN DEL PRODUCTO O SERVICIO]</strong>.
          La información y las funciones de demostración de
          esta plantilla deben sustituirse antes de su
          explotación comercial.
        </p>
      </section>

      <section>
        <h2>3. Uso de la aplicación</h2>

        <p>
          El usuario se compromete a utilizar la aplicación
          de forma lícita, a no interferir con su seguridad y
          a no acceder a cuentas, datos o recursos de
          terceros sin autorización.
        </p>
      </section>

      <section>
        <h2>4. Propiedad intelectual</h2>

        <p>
          Indica aquí la titularidad y las licencias
          aplicables al software, marca, textos, imágenes,
          bases de datos y demás contenidos:{" "}
          <strong>[TEXTO DE PROPIEDAD INTELECTUAL]</strong>.
        </p>
      </section>

      <section>
        <h2>5. Responsabilidad</h2>

        <p>
          Define las garantías ofrecidas, las limitaciones
          permitidas por la normativa aplicable, la
          disponibilidad esperada y el procedimiento para
          comunicar incidencias:{" "}
          <strong>[TEXTO DE RESPONSABILIDAD]</strong>.
        </p>
      </section>

      <section>
        <h2>6. Legislación y jurisdicción</h2>

        <p>
          Este apartado debe adaptarse al país del titular,
          al lugar de residencia de los usuarios y a las
          normas imperativas de consumidores:{" "}
          <strong>[LEGISLACIÓN Y JURISDICCIÓN]</strong>.
        </p>
      </section>

      <section>
        <h2>7. Última actualización</h2>

        <p>
          <strong>[FECHA DE PUBLICACIÓN]</strong>.
        </p>
      </section>
    </LegalDocument>
  );
}
