import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Configuración",
  description: "Configuración provisional de la cuenta.",
};

export default function SettingsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <header>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-600">
          Cuenta
        </span>

        <h1 className="mt-3 text-3xl font-medium tracking-[-0.045em] sm:text-4xl">
          Configuración
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-500">
          Estos datos son provisionales. Más adelante procederán del usuario
          autenticado en Supabase.
        </p>
      </header>

      <div className="mt-10 space-y-4">
        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
          <div className="border-b border-white/[0.07] pb-6">
            <h2 className="text-lg font-medium">Perfil</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Información visible dentro de la aplicación.
            </p>
          </div>

          <div className="mt-7 grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs text-neutral-500">
                Nombre
              </span>

              <input
                className="min-h-12 w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-4 text-sm text-neutral-300 outline-none"
                readOnly
                type="text"
                value="Álvaro"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs text-neutral-500">
                Correo electrónico
              </span>

              <input
                className="min-h-12 w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-4 text-sm text-neutral-500 outline-none"
                readOnly
                type="email"
                value="usuario@ejemplo.com"
              />
            </label>
          </div>

          <button
            className="mt-7 min-h-11 cursor-not-allowed rounded-xl bg-white px-5 text-sm font-semibold text-black opacity-50"
            disabled
            title="Estará disponible después de conectar la base de datos"
            type="button"
          >
            Guardar cambios
          </button>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-medium">Plan y facturación</h2>

              <p className="mt-2 text-sm leading-6 text-neutral-600">
                La integración con Stripe todavía no está conectada.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full border border-white/10 px-3 py-2 text-xs text-neutral-500">
                Plan Free
              </span>

              <button
                className="min-h-10 cursor-not-allowed rounded-xl border border-white/10 px-4 text-xs text-neutral-500"
                disabled
                type="button"
              >
                Gestionar
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
          <h2 className="text-lg font-medium">Estado de la infraestructura</h2>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ["Autenticación", "Pendiente"],
              ["Base de datos", "Pendiente"],
              ["Stripe", "Pendiente"],
            ].map(([service, status]) => (
              <div
                className="rounded-xl border border-white/[0.07] bg-[#0a0a0a] p-4"
                key={service}
              >
                <span className="block text-xs text-neutral-600">
                  {service}
                </span>

                <span className="mt-3 flex items-center gap-2 text-sm text-neutral-300">
                  <span className="size-1.5 rounded-full bg-neutral-600" />
                  {status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}