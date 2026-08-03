"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  getMonthlyPriceId,
  getStripeClient,
  type PaidPlan,
} from "@/lib/stripe/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type UpdateProfileState = {
  status: "idle" | "success" | "error";
  message: string;
};

export type CreateCheckoutState = {
  status: "idle" | "error";
  message: string;
};

export type CheckoutPlan = PaidPlan;

const NON_TERMINAL_SUBSCRIPTION_STATUSES = new Set([
  "incomplete",
  "trialing",
  "active",
  "past_due",
  "unpaid",
  "paused",
]);

function getFirstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

function getRequestedPaidPlan(
  value: FormDataEntryValue | null,
): PaidPlan | null {
  if (value === "plus" || value === "premium") {
    return value;
  }

  return null;
}

async function getApplicationUrl() {
  const headersList = await headers();

  const host =
    getFirstHeaderValue(
      headersList.get("x-forwarded-host"),
    ) ?? getFirstHeaderValue(headersList.get("host"));

  if (!host) {
    throw new Error(
      "No se pudo determinar el dominio de la aplicación.",
    );
  }

  const forwardedProtocol = getFirstHeaderValue(
    headersList.get("x-forwarded-proto"),
  );

  const protocol =
    forwardedProtocol ??
    (host.startsWith("localhost") ||
    host.startsWith("127.0.0.1")
      ? "http"
      : "https");

  if (protocol !== "http" && protocol !== "https") {
    throw new Error(
      "El protocolo de la aplicación no es válido.",
    );
  }

  return new URL(`${protocol}://${host}`).origin;
}

export async function updateProfile(
  _previousState: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const fullNameValue = formData.get("fullName");

  if (typeof fullNameValue !== "string") {
    return {
      status: "error",
      message: "El nombre enviado no es válido.",
    };
  }

  const fullName = fullNameValue
    .trim()
    .replace(/\s+/g, " ");

  if (fullName.length < 2) {
    return {
      status: "error",
      message:
        "El nombre debe contener al menos 2 caracteres.",
    };
  }

  if (fullName.length > 80) {
    return {
      status: "error",
      message:
        "El nombre no puede superar los 80 caracteres.",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      status: "error",
      message:
        "Tu sesión no es válida. Vuelve a iniciar sesión.",
    };
  }

  const { data: updatedProfile, error: updateError } =
    await supabase
      .from("profiles")
      .update({
        full_name: fullName,
      })
      .eq("id", user.id)
      .select("id")
      .single();

  if (updateError || !updatedProfile) {
    console.error(
      "Profile update failed:",
      updateError,
    );

    return {
      status: "error",
      message:
        "No se pudo guardar el perfil. Inténtalo de nuevo.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings");

  return {
    status: "success",
    message: "Perfil actualizado correctamente.",
  };
}

export async function createCheckoutSession(
  _previousState: CreateCheckoutState,
  formData: FormData,
): Promise<CreateCheckoutState> {
  void _previousState;

  const requestedPlan = getRequestedPaidPlan(
    formData.get("plan"),
  );

  if (!requestedPlan) {
    return {
      status: "error",
      message:
        "El plan seleccionado no es válido.",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      status: "error",
      message:
        "Tu sesión no es válida. Vuelve a iniciar sesión.",
    };
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

  if (profileError || !profile) {
    console.error(
      "Profile lookup before Checkout failed:",
      profileError,
    );

    return {
      status: "error",
      message:
        "No se pudo comprobar tu plan actual. Inténtalo de nuevo.",
    };
  }

  if (
    profile.plan === "pro" ||
    profile.plan === "plus" ||
    profile.plan === "premium"
  ) {
    return {
      status: "error",
      message:
        "Tu cuenta ya tiene una suscripción de pago.",
    };
  }

  const supabaseAdmin = getSupabaseAdminClient();

  const {
    data: existingSubscription,
    error: subscriptionError,
  } = await supabaseAdmin
    .from("subscriptions")
    .select("stripe_customer_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (subscriptionError) {
    console.error(
      "Subscription lookup before Checkout failed:",
      subscriptionError,
    );

    return {
      status: "error",
      message:
        "No se pudo comprobar tu suscripción. Inténtalo de nuevo.",
    };
  }

  if (
    existingSubscription &&
    NON_TERMINAL_SUBSCRIPTION_STATUSES.has(
      existingSubscription.status,
    )
  ) {
    return {
      status: "error",
      message:
        "Ya existe una suscripción asociada a tu cuenta.",
    };
  }

  const existingCustomerId =
    existingSubscription?.stripe_customer_id?.trim();

  let checkoutUrl: string | null = null;

  try {
    const stripe = getStripeClient();
    const applicationUrl = await getApplicationUrl();

    const checkoutSession =
      await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [
          {
            price: getMonthlyPriceId(requestedPlan),
            quantity: 1,
          },
        ],
        client_reference_id: user.id,

        ...(existingCustomerId
          ? {
              customer: existingCustomerId,
            }
          : {
              customer_email:
                user.email ?? undefined,
            }),

        metadata: {
          supabase_user_id: user.id,
          requested_plan: requestedPlan,
        },

        subscription_data: {
          metadata: {
            supabase_user_id: user.id,
            requested_plan: requestedPlan,
          },
        },

        success_url:
          `${applicationUrl}/settings?checkout=success`,
        cancel_url:
          `${applicationUrl}/settings?checkout=cancelled`,
      });

    checkoutUrl = checkoutSession.url;
  } catch (error) {
    console.error(
      "Stripe Checkout Session creation failed:",
      error,
    );

    return {
      status: "error",
      message:
        "No se pudo iniciar el proceso de pago. Inténtalo de nuevo.",
    };
  }

  if (!checkoutUrl) {
    return {
      status: "error",
      message:
        "Stripe no devolvió una dirección de pago válida.",
    };
  }

  redirect(checkoutUrl);
}