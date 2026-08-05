import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { BillingPortalButton } from "@/components/app/billing-portal-button";
import { CheckoutButton } from "@/components/app/checkout-button";
import { DeleteAccountForm } from "@/components/app/delete-account-form";
import { ProfileForm } from "@/components/app/profile-form";
import { UserAvatar } from "@/components/app/user-avatar";
import {
  getPlanFallbackPriceLabel,
  getPlanLabel,
  hasMinimumPlan,
} from "@/config/plans";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import {
  getCurrentSubscription,
  type CurrentSubscriptionResult,
} from "@/lib/billing/current-subscription";
import {
  getSubscriptionStatusLabel,
  isCheckoutBlockingSubscriptionStatus,
  subscriptionRequiresBillingAttention,
} from "@/lib/billing/subscription-status";
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
      ? `Tu suscripción seguirá activa hasta el ${cancellationDate}. Después pasarás al plan ${getPlanLabel("free")}.`
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
      return "Stripe no ha podido completar el último cobro. Conservas el acceso mientras se intenta recuperar el pago.";

    case "unpaid":
      return "La suscripción tiene un pago pendiente y el acceso de pago está desactivado. Revisa la facturación en Stripe.";

    case "paused":
      return "La suscripción se encuentra pausada y el acceso de pago está desactivado.";

    case "incomplete":
      return "La activación de la suscripción no se ha completado. Revisa la facturación antes de volver a intentarlo.";

    case "incomplete_expired":
      return "El intento de activar la suscripción ha caducado. Puedes iniciar una nueva suscripción.";

    case "canceled":
      return "La suscripción está cancelada. Puedes elegir un nuevo plan cuando quieras.";

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

  const plusPlanLabel = getPlanLabel("plus");
  const premiumPlanLabel =
    getPlanLabel("premium");
  const planLabel = getPlanLabel(profile.plan);

  const plusPriceLabel =
    stripeConfiguration.plans.plus.priceLabel ??
    getPlanFallbackPriceLabel("plus");

  const premiumPriceLabel =
    stripeConfiguration.plans.premium.priceLabel ??
    getPlanFallbackPriceLabel("premium");

  const billingDescription =
    getBillingDescription(currentSubscription);

  const synchronizedSubscription =
    currentSubscription.subscription;

  const hasScheduledCancellation =
    synchronizedSubscription
      ?.isCancellationScheduled === true;

  const shouldManageSubscription =
    synchronizedSubscription !== null &&
    isCheckoutBlockingSubscriptionStatus(
      synchronizedSubscription.status,
    );

  const canChooseNewPlan =
    currentSubscription.available &&
    !hasMinimumPlan(profile.plan, "plus") &&
    !shouldManageSubscription;

  const synchronizedPlanLabel =
    synchronizedSubscription
      ? getPlanLabel(synchronizedSubscription.plan)
      : null;

  const billingStatusLabel =
    synchronizedSubscription
      ? getSubscriptionStatusLabel(
          synchronizedSubscription.status,
          synchronizedSubscription
            .isCancellationScheduled,
        )
      : null;

  const billingNeedsAttention =
    synchronizedSubscription
      ? subscriptionRequiresBillingAttention(
          synchronizedSubscription.status,
        )
      : false;

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
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-app-text-muted">
          Cuenta
        </span>

        <h1 className="mt-3 text-3xl font-medium tracking-[-0.045em] text-app-text sm:text-4xl">
          Configuración
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-app-text-soft">
          Gestiona la información almacenada en el perfil
          de tu cuenta.
        </p>
      </header>

      <div className="mt-10 space-y-4">
        <section className="rounded-2xl border border-app-border bg-app-surface-subtle p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-6 border-b border-app-border pb-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-medium text-app-text">
                Perfil
              </h2>

              <p className="mt-2 text-sm leading-6 text-app-text-muted">
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
                <span className="block text-sm font-medium text-app-text">
                  {profile.displayName}
                </span>

                <span className="mt-1 block text-xs text-app-text-muted">
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

          <p className="mt-6 text-xs leading-5 text-app-text-muted">
            El correo electrónico procede de Google y
            todavía no puede modificarse desde esta
            aplicación.
          </p>
        </section>

        <section className="rounded-2xl border border-app-border bg-app-surface-subtle p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-lg font-medium text-app-text">
                Plan y facturación
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-app-text-muted">
                {stripeConfiguration.connected
                  ? `Stripe ha validado las tarifas mensuales de ${plusPlanLabel} y ${premiumPlanLabel}.`
                  : "Stripe todavía no ha podido validar todas las tarifas configuradas."}
              </p>
            </div>

            <span className="w-fit rounded-full border border-app-border px-3 py-2 text-xs text-app-text-soft">
              Plan {planLabel}
            </span>
          </div>

          {shouldManageSubscription &&
          synchronizedSubscription ? (
            <div className="mt-6 flex flex-col justify-between gap-5 rounded-xl border border-app-border bg-app-page-soft p-5 sm:flex-row sm:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-app-text">
                    Suscripción {synchronizedPlanLabel}
                  </span>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] ${
                      billingNeedsAttention
                        ? "border-app-border-strong text-app-text-soft"
                        : "border-app-border text-app-text-soft"
                    }`}
                  >
                    {billingStatusLabel}
                  </span>
                </div>

                <p
                  className={`mt-3 max-w-xl text-xs leading-5 ${
                    hasScheduledCancellation ||
                    billingNeedsAttention
                      ? "text-app-text-soft"
                      : "text-app-text-muted"
                  }`}
                >
                  {billingDescription}
                </p>
              </div>

              <BillingPortalButton
                label={
                  billingNeedsAttention
                    ? "Revisar facturación"
                    : "Gestionar suscripción"
                }
              />
            </div>
          ) : canChooseNewPlan ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <article className="flex flex-col rounded-xl border border-app-border bg-app-page-soft p-5">
                <div>
                  <span className="text-sm font-medium text-app-text">
                    {plusPlanLabel}
                  </span>

                  <p className="mt-3 text-2xl font-medium tracking-[-0.04em] text-app-text">
                    {plusPriceLabel}
                  </p>

                  <p className="mt-3 text-xs leading-5 text-app-text-muted">
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
                    label={`Elegir ${plusPlanLabel}`}
                    plan="plus"
                  />
                </div>
              </article>

              <article className="flex flex-col rounded-xl border border-app-border-strong bg-app-surface-active p-5">
                <div>
                  <span className="text-sm font-medium text-app-text">
                    {premiumPlanLabel}
                  </span>

                  <p className="mt-3 text-2xl font-medium tracking-[-0.04em] text-app-text">
                    {premiumPriceLabel}
                  </p>

                  <p className="mt-3 text-xs leading-5 text-app-text-muted">
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
                    label={`Elegir ${premiumPlanLabel}`}
                    plan="premium"
                  />
                </div>
              </article>
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-app-border bg-app-page-soft p-5">
              <span className="text-sm font-medium text-app-text">
                Estado de facturación no disponible
              </span>

              <p className="mt-3 max-w-xl text-xs leading-5 text-app-text-soft">
                {billingDescription}
              </p>

              <p className="mt-2 max-w-xl text-xs leading-5 text-app-text-muted">
                No se ofrecerá una nueva compra hasta poder
                verificar de forma segura el estado de la
                suscripción.
              </p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-app-border bg-app-surface-subtle p-6 sm:p-8">
          <h2 className="text-lg font-medium text-app-text">
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
                    className="rounded-xl border border-app-border bg-app-page-soft p-4"
                    key={service}
                  >
                    <span className="block text-xs text-app-text-muted">
                      {service}
                    </span>

                    <span className="mt-3 flex items-center gap-2 text-sm text-app-text-soft">
                      <span
                        className={`size-1.5 rounded-full ${
                          isUnavailable
                            ? "bg-app-text-muted"
                            : "bg-app-accent"
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

        <section className="rounded-2xl border border-app-border-strong bg-app-surface-subtle p-6 sm:p-8">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-app-danger">
            Zona de riesgo
          </span>

          <h2 className="mt-3 text-lg font-medium text-app-text">
            Eliminar cuenta
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-app-text-muted">
            Esta acción cancela la facturación, elimina
            el usuario de autenticación y borra mediante
            cascada el perfil y la suscripción
            sincronizada. No se puede deshacer.
          </p>

          <DeleteAccountForm />
        </section>
      </div>
    </main>
  );
}
