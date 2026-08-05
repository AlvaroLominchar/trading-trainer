import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal/legal-document";

export const metadata: Metadata = {
  title: "Cookies",
  description:
    "Política provisional de cookies de la aplicación.",
};

export default function CookiesPage() {
  return (
    <LegalDocument
      description="Información provisional sobre las cookies y tecnologías similares utilizadas por la plantilla."
      title="Política de cookies"
    >
      <section>
        <h2>1. Uso actual</h2>

        <p>
          La versión actual utiliza cookies técnicas
          necesarias para mantener la sesión autenticada,
          refrescar credenciales y proteger el acceso a las
          páginas privadas.
        </p>

        <p>
          En el código auditado no se integra una plataforma
          de analítica, publicidad o personalización basada
          en cookies no esenciales.
        </p>
      </section>

      <section>
        <h2>2. Servicios externos</h2>

        <p>
          Google interviene durante el acceso, Stripe
          gestiona Checkout y el portal de facturación en
          sus propios dominios, y Supabase mantiene la
          sesión de la aplicación. Estos proveedores pueden
          aplicar sus propias tecnologías y políticas en
          los dominios que controlan.
        </p>
      </section>

      <section>
        <h2>3. Relación provisional</h2>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-app-border text-app-text">
                <th className="px-3 py-3">Categoría</th>
                <th className="px-3 py-3">Finalidad</th>
                <th className="px-3 py-3">Duración</th>
              </tr>
            </thead>

            <tbody>
              <tr className="border-b border-app-border">
                <td className="px-3 py-3">
                  Sesión y autenticación
                </td>
                <td className="px-3 py-3">
                  Acceso, renovación de sesión y seguridad.
                </td>
                <td className="px-3 py-3">
                  <strong>
                    [VERIFICAR CONFIGURACIÓN REAL]
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>4. Gestión</h2>

        <p>
          El usuario puede bloquear o eliminar cookies desde
          el navegador, aunque las cookies técnicas son
          necesarias para mantener la sesión iniciada.
        </p>
      </section>

      <section>
        <h2>5. Cambios futuros</h2>

        <p>
          Antes de añadir analítica, publicidad u otras
          tecnologías no esenciales, revisa los requisitos
          de información y consentimiento de los países
          donde operará el producto e implementa el
          mecanismo correspondiente.
        </p>
      </section>

      <section>
        <h2>6. Última actualización</h2>

        <p>
          <strong>[FECHA DE PUBLICACIÓN]</strong>.
        </p>
      </section>
    </LegalDocument>
  );
}
