import "server-only";

import Stripe from "stripe";

import {
  getExpectedMonthlyAmount,
  type PaidPlan,
} from "@/config/plans";

type StripeEnvironmentVariable =
  | "STRIPE_SECRET_KEY"
  | "STRIPE_PRICE_PLUS_MONTHLY"
  | "STRIPE_PRICE_PREMIUM_MONTHLY"
  | "STRIPE_WEBHOOK_SECRET";

function getRequiredEnvironmentVariable(
  name: StripeEnvironmentVariable,
) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Falta la variable de entorno obligatoria: ${name}`,
    );
  }

  return value;
}

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  if (!stripeClient) {
    stripeClient = new Stripe(
      getRequiredEnvironmentVariable("STRIPE_SECRET_KEY"),
    );
  }

  return stripeClient;
}

export function getMonthlyPriceId(plan: PaidPlan) {
  return plan === "plus"
    ? getRequiredEnvironmentVariable(
        "STRIPE_PRICE_PLUS_MONTHLY",
      )
    : getRequiredEnvironmentVariable(
        "STRIPE_PRICE_PREMIUM_MONTHLY",
      );
}

export function getPaidPlanFromPriceId(
  priceId: string,
): PaidPlan | null {
  if (priceId === getMonthlyPriceId("plus")) {
    return "plus";
  }

  if (priceId === getMonthlyPriceId("premium")) {
    return "premium";
  }

  return null;
}

export function getStripeWebhookSecret() {
  return getRequiredEnvironmentVariable(
    "STRIPE_WEBHOOK_SECRET",
  );
}

export type StripePlanPriceStatus = {
  connected: boolean;
  priceLabel: string | null;
};

export type StripeConfigurationStatus = {
  connected: boolean;

  /*
   * Compatibilidad temporal con settings/page.tsx.
   * Representa el precio Premium actual.
   */
  priceLabel: string | null;

  plans: Record<PaidPlan, StripePlanPriceStatus>;
};

async function getStripePlanPriceStatus(
  plan: PaidPlan,
): Promise<StripePlanPriceStatus> {
  try {
    const stripe = getStripeClient();
    const priceId = getMonthlyPriceId(plan);

    const price = await stripe.prices.retrieve(priceId);

    const recurring = price.recurring;
    const unitAmount = price.unit_amount;
    const expectedUnitAmount =
      getExpectedMonthlyAmount(plan);

    if (
      !price.active ||
      price.type !== "recurring" ||
      recurring?.interval !== "month" ||
      recurring.interval_count !== 1 ||
      price.currency.toLowerCase() !== "eur" ||
      unitAmount !== expectedUnitAmount
    ) {
      console.error(
        `La tarifa configurada para ${plan} no coincide con la tarifa mensual esperada.`,
      );

      return {
        connected: false,
        priceLabel: null,
      };
    }

    const formattedAmount = new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(unitAmount / 100);

    return {
      connected: true,
      priceLabel: `${formattedAmount}/mes`,
    };
  } catch (error) {
    console.error(
      `No se pudo validar la tarifa de Stripe para ${plan}:`,
      error,
    );

    return {
      connected: false,
      priceLabel: null,
    };
  }
}

export async function getStripeConfigurationStatus(): Promise<StripeConfigurationStatus> {
  const [plus, premium] = await Promise.all([
    getStripePlanPriceStatus("plus"),
    getStripePlanPriceStatus("premium"),
  ]);

  const priceIdsAreDifferent =
    getMonthlyPriceId("plus") !==
    getMonthlyPriceId("premium");

  if (!priceIdsAreDifferent) {
    console.error(
      "Plus y Premium no pueden utilizar el mismo precio de Stripe.",
    );
  }

  return {
    connected:
      plus.connected &&
      premium.connected &&
      priceIdsAreDifferent,
    priceLabel: premium.priceLabel,
    plans: {
      plus,
      premium,
    },
  };
}
