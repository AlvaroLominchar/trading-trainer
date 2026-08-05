import type Stripe from "stripe";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getPaidPlanFromPriceId,
  getStripeClient,
  getStripeWebhookSecret,
  isStripeResourceMissingError,
} from "@/lib/stripe/server";

export const runtime = "nodejs";

const SUPPORTED_EVENTS = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
  "invoice.paid",
  "invoice.payment_failed",
]);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getStripeObjectId(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string"
  ) {
    return value.id;
  }

  return null;
}

function getInvoiceSubscriptionId(
  invoice: Stripe.Invoice,
) {
  const currentSubscriptionId = getStripeObjectId(
    invoice.parent?.subscription_details
      ?.subscription,
  );

  if (currentSubscriptionId) {
    return currentSubscriptionId;
  }

  const legacyInvoice = invoice as Stripe.Invoice & {
    subscription?: unknown;
  };

  return getStripeObjectId(
    legacyInvoice.subscription,
  );
}

function getSubscriptionIdFromEvent(
  event: Stripe.Event,
) {
  switch (event.type) {
    case "checkout.session.completed": {
      const checkoutSession =
        event.data.object as Stripe.Checkout.Session;

      return getStripeObjectId(
        checkoutSession.subscription,
      );
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.paused":
    case "customer.subscription.resumed": {
      const subscription =
        event.data.object as Stripe.Subscription;

      return subscription.id;
    }

    case "invoice.paid":
    case "invoice.payment_failed": {
      const invoice =
        event.data.object as Stripe.Invoice;

      return getInvoiceSubscriptionId(invoice);
    }

    default:
      return null;
  }
}

async function getCurrentStripeSubscription(
  event: Stripe.Event,
  subscriptionId: string,
) {
  try {
    return await getStripeClient().subscriptions.retrieve(
      subscriptionId,
    );
  } catch (error) {
    if (
      event.type ===
        "customer.subscription.deleted" &&
      isStripeResourceMissingError(error)
    ) {
      return event.data.object as Stripe.Subscription;
    }

    throw error;
  }
}

async function synchronizeSubscription(
  event: Stripe.Event,
  subscriptionId: string,
) {
  /*
   * Recuperamos siempre el estado actual de Stripe.
   * Para una eliminación ya purgada, el payload del evento
   * deleted es la fuente final disponible.
   */
  const subscription =
    await getCurrentStripeSubscription(
      event,
      subscriptionId,
    );

  const subscriptionItem =
    subscription.items.data.find(
      (item) =>
        getPaidPlanFromPriceId(
          item.price.id,
        ) !== null,
    );

  if (!subscriptionItem) {
    throw new Error(
      `La suscripción ${subscription.id} no utiliza un precio configurado para Plus o Premium.`,
    );
  }

  const plan = getPaidPlanFromPriceId(
    subscriptionItem.price.id,
  );

  if (!plan) {
    throw new Error(
      `No se pudo determinar el plan de la suscripción ${subscription.id}.`,
    );
  }

  const userId =
    subscription.metadata.supabase_user_id?.trim();

  if (!userId || !UUID_PATTERN.test(userId)) {
    throw new Error(
      `La suscripción ${subscription.id} no contiene un UUID de Supabase válido.`,
    );
  }

  const customerId = getStripeObjectId(
    subscription.customer,
  );

  if (!customerId) {
    throw new Error(
      `La suscripción ${subscription.id} no contiene un cliente válido.`,
    );
  }

  const subscriptionCreatedAt = new Date(
    subscription.created * 1000,
  ).toISOString();

  const currentPeriodEnd =
    typeof subscriptionItem.current_period_end ===
    "number"
      ? new Date(
          subscriptionItem.current_period_end *
            1000,
        ).toISOString()
      : null;

  const cancelAt =
    typeof subscription.cancel_at === "number"
      ? new Date(
          subscription.cancel_at * 1000,
        ).toISOString()
      : null;

  const eventCreatedAt = new Date(
    event.created * 1000,
  ).toISOString();

  const supabaseAdmin =
    getSupabaseAdminClient();

  const { data: processed, error } =
    await supabaseAdmin.rpc(
      "sync_stripe_subscription",
      {
        p_event_id: event.id,
        p_event_type: event.type,
        p_event_created_at: eventCreatedAt,
        p_user_id: userId,
        p_stripe_customer_id: customerId,
        p_stripe_subscription_id:
          subscription.id,
        p_subscription_created_at:
          subscriptionCreatedAt,
        p_stripe_price_id:
          subscriptionItem.price.id,
        p_plan: plan,
        p_status: subscription.status,
        p_current_period_end:
          currentPeriodEnd,
        p_cancel_at_period_end:
          subscription.cancel_at_period_end,
        p_cancel_at: cancelAt,
      },
    );

  if (error) {
    throw new Error(
      `Supabase no pudo sincronizar la suscripción: ${error.message}`,
    );
  }

  return processed;
}

export async function POST(request: Request) {
  const stripeSignature =
    request.headers.get("stripe-signature");

  if (!stripeSignature) {
    return new Response(
      "Falta la cabecera Stripe-Signature.",
      {
        status: 400,
      },
    );
  }

  const rawBody = await request.text();

  let event: Stripe.Event;

  try {
    event =
      getStripeClient().webhooks.constructEvent(
        rawBody,
        stripeSignature,
        getStripeWebhookSecret(),
      );
  } catch (error) {
    console.error(
      "Stripe webhook signature verification failed:",
      error,
    );

    return new Response(
      "La firma del webhook no es válida.",
      {
        status: 400,
      },
    );
  }

  if (!SUPPORTED_EVENTS.has(event.type)) {
    return Response.json({
      received: true,
      handled: false,
    });
  }

  const subscriptionId =
    getSubscriptionIdFromEvent(event);

  if (!subscriptionId) {
    console.error(
      `No se encontró una suscripción en el evento ${event.id} de tipo ${event.type}.`,
    );

    return new Response(
      "No se pudo identificar la suscripción.",
      {
        status: 500,
      },
    );
  }

  try {
    const processed =
      await synchronizeSubscription(
        event,
        subscriptionId,
      );

    return Response.json({
      received: true,
      handled: true,
      processed: processed === true,
    });
  } catch (error) {
    console.error(
      `Stripe webhook processing failed for event ${event.id}:`,
      error,
    );

    return new Response(
      "No se pudo procesar el evento de Stripe.",
      {
        status: 500,
      },
    );
  }
}
