import Stripe from "stripe";

type StripeEnvironmentVariable =
  | "STRIPE_SECRET_KEY"
  | "STRIPE_PRICE_PRO_MONTHLY";

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

export function getProMonthlyPriceId() {
  return getRequiredEnvironmentVariable(
    "STRIPE_PRICE_PRO_MONTHLY",
  );
}

export type StripeConfigurationStatus = {
  connected: boolean;
  priceLabel: string | null;
};

export async function getStripeConfigurationStatus(): Promise<StripeConfigurationStatus> {
  try {
    const stripe = getStripeClient();

    const price = await stripe.prices.retrieve(
      getProMonthlyPriceId(),
    );

    const recurring = price.recurring;
    const unitAmount = price.unit_amount;

    if (
      !price.active ||
      price.type !== "recurring" ||
      recurring?.interval !== "month" ||
      recurring?.interval_count !== 1 ||
      typeof unitAmount !== "number"
    ) {
      console.error(
        "El precio configurado no es una tarifa mensual activa.",
      );

      return {
        connected: false,
        priceLabel: null,
      };
    }

    const formattedAmount = new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: price.currency.toUpperCase(),
    }).format(unitAmount / 100);

    return {
      connected: true,
      priceLabel: `${formattedAmount}/mes`,
    };
  } catch (error) {
    console.error(
      "No se pudo validar la configuración de Stripe:",
      error,
    );

    return {
      connected: false,
      priceLabel: null,
    };
  }
}