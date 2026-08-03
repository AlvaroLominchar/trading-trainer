import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { BillingPortalButton } from "@/components/app/billing-portal-button";
import { CheckoutButton } from "@/components/app/checkout-button";
import { ProfileForm } from "@/components/app/profile-form";
import { UserAvatar } from "@/components/app/user-avatar";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import {
  getCurrentSubscription,
  type CurrentSubscriptionResult,
} from "@/lib/billing/current-subscription";
import { getStripeConfigurationStatus } from "@/lib/stripe/server";

export const metadata: Metadata = {
  title: "Configuración",
  description: "Configuración de la cuenta.",
};

function formatBillingDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function getBillingDescription(
  result: CurrentSubscriptionResult,
) {
  if (!result.available) {
    return "No se pudo consultar el estado actual de la suscripción.";
  }

  const subscription = result.subscription;

  if (!subscription) {
    return "No se encontró una suscripción sincronizada para esta cuenta.";
  }

  const cancellationDate = formatBillingDate(
    subscription.cancellationDate,
  );

  if (subscription.isCancellationScheduled) {
    return cancellationDate
      ? `Tu suscripción seguirá activa hasta el ${cancellationDate}. Después pasarás al plan Free.`
      : "Tu suscripción tiene una cancelación programada y continuará activa hasta terminar el periodo actual.";
  }

  const renewalDate = formatBillingDate(
    subscription.currentPeriodEnd,
  );

  switch (subscription.status) {
    case "active":
      return renewalDate
        ? `Renovación automática prevista para el ${renewalDate}.`
        : "La suscripción está activa y se renovará automáticamente.";

    case "trialing":
      return renewalDate
        ? `El periodo de prueba termina el ${renewalDate}.`
        : "La suscripción se encuentra en periodo de prueba.";

    case "past_due":
      return "Stripe no ha podido completar el último cobro. Revisa el método de pago.";

    case "unpaid":
      return "La suscripción tiene un pago pendiente. Revisa la facturación en Stripe.";

    case "paused":
      return "La suscripción se encuentra temporalmente pausada.";

    case "incomplete":
      return "La activación de la suscripción todavía no se ha completado.";

    case "incomplete_expired":
      return "El intento de activar la suscripción ha caducado.";

    case "canceled":
      return "La suscripción figura como cancelada en Stripe.";

    default:
      return "Consulta Stripe para revisar el estado actual de la suscripción.";
  }
}

export default async function SettingsPage() {
  const currentProfile = await getCurrentProfile();

  if (!currentProfile) {
    redirect("/login");
  }

  const { databaseConnected, profile, user } =
    currentProfile;

  const [
    stripeConfiguration,
    currentSubscription,
  ] = await Promise.all([
    getStripeConfigurationStatus(),
    getCurrentSubscription(user.id),
  ]);

  const provider =
    user.app_metadata.provider === "google"
      ? "Google"
      : user.app_metadata.provider ??
        "Desconocido";

  const planLabel =
    profile.plan === "premium"
      ? "Premium"
      : profile.plan === "plus"
        ? "Plus"
        : "Free";

  const isPaidPlan = profile.plan !== "free";

  const plusPriceLabel =
    stripeConfiguration.plans.plus.priceLabel ??
    "4,99 €/mes";

  const premiumPriceLabel =
    stripeConfiguration.plans.premium.priceLabel ??
    "19,99 €/mes";

  const billingDescription =
    getBillingDescription(currentSubscription);

  const hasScheduledCancellation =
    currentSubscription.subscription
      ?.isCancellationScheduled === true;

  const infrastructure = [
    ["Autenticación", "Conectada"],
    [
      "PostgreSQL",
      databaseConnected
        ? "Perfil conectado"
        : "Perfil no disponible",
    ],
    [
      "Stripe",
      stripeConfiguration.connected
        ? "Precios conectados"
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
          Gestiona la información almacenada en el
          perfil de tu cuenta.
        </p>
      </header>

      <div className="mt-10 space-y-4">
        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-6 border-b border-white/[0.07] pb-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-medium">
                Perfil
              </h2>

              <p className="mt-2 text-sm text-neutral-600">
                El nombre se almacena en PostgreSQL y
                puede editarse sin modificar tu cuenta
                original de Google.
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
            El correo electrónico procede de Google y
            todavía no puede modificarse desde esta
            aplicación.
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-lg font-medium">
                Plan y facturación
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
                {stripeConfiguration.connected
                  ? "Stripe ha validado las tarifas mensuales de Plus y Premium."
                  : "Stripe todavía no ha podido validar todas las tarifas configuradas."}
              </p>
            </div>

            <span className="w-fit rounded-full border border-white/10 px-3 py-2 text-xs text-neutral-500">
              Plan {planLabel}
            </span>
          </div>

          {isPaidPlan ? (
            <div className="mt-6 flex flex-col justify-between gap-5 rounded-xl border border-white/[0.07] bg-[#0a0a0a] p-5 sm:flex-row sm:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-neutral-200">
                    Suscripción {planLabel}
                  </span>

                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-neutral-500">
                    {hasScheduledCancellation
                      ? "Cancelación programada"
                      : "Renovación automática"}
                  </span>
                </div>

                <p
                  className={`mt-3 max-w-xl text-xs leading-5 ${
                    hasScheduledCancellation
                      ? "text-neutral-300"
                      : "text-neutral-600"
                  }`}
                >
                  {billingDescription}
                </p>
              </div>

              <BillingPortalButton />
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <article className="flex flex-col rounded-xl border border-white/[0.07] bg-[#0a0a0a] p-5">
                <div>
                  <span className="text-sm font-medium text-neutral-200">
                    Plus
                  </span>

                  <p className="mt-3 text-2xl font-medium tracking-[-0.04em] text-white">
                    {plusPriceLabel}
                  </p>

                  <p className="mt-3 text-xs leading-5 text-neutral-600">
                    El nivel de entrada para usuarios que
                    necesitan más capacidad que el plan
                    gratuito.
                  </p>
                </div>

                <div className="mt-6">
                  <CheckoutButton
                    disabled={
                      !stripeConfiguration.plans.plus
                        .connected
                    }
                    label="Elegir Plus"
                    plan="plus"
                  />
                </div>
              </article>

              <article className="flex flex-col rounded-xl border border-white/15 bg-white/[0.035] p-5">
                <div>
                  <span className="text-sm font-medium text-neutral-200">
                    Premium
                  </span>

                  <p className="mt-3 text-2xl font-medium tracking-[-0.04em] text-white">
                    {premiumPriceLabel}
                  </p>

                  <p className="mt-3 text-xs leading-5 text-neutral-600">
                    El nivel completo para usuarios que
                    necesitan todas las funciones de la
                    aplicación.
                  </p>
                </div>

                <div className="mt-6">
                  <CheckoutButton
                    disabled={
                      !stripeConfiguration.plans.premium
                        .connected
                    }
                    label="Elegir Premium"
                    plan="premium"
                  />
                </div>
              </article>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
          <h2 className="text-lg font-medium">
            Estado de la infraestructura
          </h2>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {infrastructure.map(
              ([service, status]) => {
                const isUnavailable =
                  status ===
                    "Configuración pendiente" ||
                  status ===
                    "Perfil no disponible";

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
              },
            )}
          </div>
        </section>
      </div>
    </main>
  );
}