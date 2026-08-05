import { describe, expect, it } from "vitest";

import {
  getSubscriptionStatusLabel,
  isCheckoutBlockingSubscriptionStatus,
  subscriptionRequiresBillingAttention,
} from "./subscription-status";

describe("subscription status policy", () => {
  it.each([
    "incomplete",
    "trialing",
    "active",
    "past_due",
    "unpaid",
    "paused",
  ])(
    "blocks a new Checkout for %s",
    (status) => {
      expect(
        isCheckoutBlockingSubscriptionStatus(
          status,
        ),
      ).toBe(true);
    },
  );

  it.each([
    "incomplete_expired",
    "canceled",
    "unknown",
  ])(
    "allows a new Checkout for %s",
    (status) => {
      expect(
        isCheckoutBlockingSubscriptionStatus(
          status,
        ),
      ).toBe(false);
    },
  );

  it.each([
    "incomplete",
    "past_due",
    "unpaid",
    "paused",
  ])(
    "requires billing attention for %s",
    (status) => {
      expect(
        subscriptionRequiresBillingAttention(
          status,
        ),
      ).toBe(true);
    },
  );

  it.each([
    "trialing",
    "active",
    "incomplete_expired",
    "canceled",
  ])(
    "does not require billing attention for %s",
    (status) => {
      expect(
        subscriptionRequiresBillingAttention(
          status,
        ),
      ).toBe(false);
    },
  );

  it("prioritizes a scheduled cancellation label", () => {
    expect(
      getSubscriptionStatusLabel(
        "active",
        true,
      ),
    ).toBe("Cancelación programada");
  });

  it.each([
    ["active", "Renovación automática"],
    ["trialing", "Periodo de prueba"],
    ["past_due", "Cobro pendiente"],
    ["unpaid", "Pago pendiente"],
    ["paused", "Suscripción pausada"],
    ["incomplete", "Activación pendiente"],
    [
      "incomplete_expired",
      "Activación caducada",
    ],
    ["canceled", "Cancelada"],
    ["unknown", "Estado por revisar"],
  ])(
    "maps %s to its UI label",
    (status, expectedLabel) => {
      expect(
        getSubscriptionStatusLabel(
          status,
          false,
        ),
      ).toBe(expectedLabel);
    },
  );
});
