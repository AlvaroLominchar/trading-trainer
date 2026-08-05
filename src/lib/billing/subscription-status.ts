export const CHECKOUT_BLOCKING_SUBSCRIPTION_STATUSES = [
  "incomplete",
  "trialing",
  "active",
  "past_due",
  "unpaid",
  "paused",
] as const;

const checkoutBlockingStatuses = new Set<string>(
  CHECKOUT_BLOCKING_SUBSCRIPTION_STATUSES,
);

const billingAttentionStatuses = new Set<string>([
  "incomplete",
  "past_due",
  "unpaid",
  "paused",
]);

export function isCheckoutBlockingSubscriptionStatus(
  status: string,
) {
  return checkoutBlockingStatuses.has(status);
}

export function subscriptionRequiresBillingAttention(
  status: string,
) {
  return billingAttentionStatuses.has(status);
}

export function getSubscriptionStatusLabel(
  status: string,
  isCancellationScheduled: boolean,
) {
  if (isCancellationScheduled) {
    return "Cancelación programada";
  }

  switch (status) {
    case "active":
      return "Renovación automática";

    case "trialing":
      return "Periodo de prueba";

    case "past_due":
      return "Cobro pendiente";

    case "unpaid":
      return "Pago pendiente";

    case "paused":
      return "Suscripción pausada";

    case "incomplete":
      return "Activación pendiente";

    case "incomplete_expired":
      return "Activación caducada";

    case "canceled":
      return "Cancelada";

    default:
      return "Estado por revisar";
  }
}