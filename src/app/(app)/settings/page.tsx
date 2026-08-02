import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/app/profile-form";
import { UserAvatar } from "@/components/app/user-avatar";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { getStripeConfigurationStatus } from "@/lib/stripe/server";

export const metadata: Metadata = {
  title: "Configuración",
  description: "Configuración de la cuenta.",
};

export default async function SettingsPage() {
  const currentProfile = await getCurrentProfile();

  if (!currentProfile) {
    redirect("/login");
  }

  const { databaseConnected, profile, user } = currentProfile;

  const stripeConfiguration =
    await getStripeConfigurationStatus();

  const provider =
    user.app_metadata.provider === "google"
      ? "Google"
      : user.app_metadata.provider ?? "Desconocido";

  const infrastructure = [
    ["Autenticación", "Conectada"],
    [
      "PostgreSQL",
      databaseConnected ? "Perfil conectado" : "Perfil no disponible",
    ],
    [
      "Stripe",
      stripeConfiguration.connected
        ? "Precio conectado"
        : "Configuración pendiente",
    ],
  ];

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
          Gestiona la información almacenada en el perfil de tu cuenta.
        </p>
      </header>

      <div className="mt-10 space-y-4">
        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-6 border-b border-white/[0.07] pb-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-medium">Perfil</h2>

              <p className="mt-2 text-sm text-neutral-600">
                El nombre se almacena en PostgreSQL y puede editarse sin
                modificar tu cuenta original de Google.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <UserAvatar
                alt={`Avatar de ${profile.displayName}`}
                avatarUrl={profile.avatarUrl}
                initial={profile.initial}
                size={52}
              />

              <div>
                <span className="block text-sm font-medium text-neutral-200">
                  {profile.displayName}
                </span>

                <span className="mt-1 block text-xs text-neutral-600">
                  Acceso mediante {provider}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-7">
            <ProfileForm
              email={profile.email}
              fullName={profile.displayName}
            />
          </div>

          <p className="mt-6 text-xs leading-5 text-neutral-600">
            El correo electrónico procede de Google y todavía no puede
            modificarse desde esta aplicación.
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-medium">
                Plan y facturación
              </h2>

              <p className="mt-2 text-sm leading-6 text-neutral-600">
                {stripeConfiguration.connected &&
                stripeConfiguration.priceLabel
                  ? `Stripe está conectado al precio ${stripeConfiguration.priceLabel}.`
                  : "Stripe todavía no ha podido validar el precio configurado."}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full border border-white/10 px-3 py-2 text-xs text-neutral-500">
                Plan {profile.plan === "pro" ? "Pro" : "Free"}
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
          <h2 className="text-lg font-medium">
            Estado de la infraestructura
          </h2>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {infrastructure.map(([service, status]) => {
              const isUnavailable =
                status === "Configuración pendiente" ||
                status === "Perfil no disponible";

              return (
                <div
                  className="rounded-xl border border-white/[0.07] bg-[#0a0a0a] p-4"
                  key={service}
                >
                  <span className="block text-xs text-neutral-600">
                    {service}
                  </span>

                  <span className="mt-3 flex items-center gap-2 text-sm text-neutral-300">
                    <span
                      className={`size-1.5 rounded-full ${
                        isUnavailable
                          ? "bg-neutral-600"
                          : "bg-white"
                      }`}
                    />

                    {status}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}