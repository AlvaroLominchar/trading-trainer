import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type DatabaseSubscription = {
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  cancel_at: string | null;
};

export type CurrentSubscriptionSummary = {
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  cancelAt: string | null;
  cancellationDate: string | null;
  isCancellationScheduled: boolean;
};

export type CurrentSubscriptionResult = {
  available: boolean;
  subscription: CurrentSubscriptionSummary | null;
};

export async function getCurrentSubscription(
  userId: string,
): Promise<CurrentSubscriptionResult> {
  const supabaseAdmin = getSupabaseAdminClient();

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select(
      [
        "status",
        "current_period_end",
        "cancel_at_period_end",
        "cancel_at",
      ].join(", "),
    )
    .eq("user_id", userId)
    .maybeSingle<DatabaseSubscription>();

  if (error) {
    console.error(
      "Current subscription lookup failed:",
      error,
    );

    return {
      available: false,
      subscription: null,
    };
  }

  if (!data) {
    return {
      available: true,
      subscription: null,
    };
  }

  const cancellationDate =
    data.cancel_at ??
    (data.cancel_at_period_end
      ? data.current_period_end
      : null);

  return {
    available: true,
    subscription: {
      status: data.status,
      currentPeriodEnd: data.current_period_end,
      cancelAtPeriodEnd: data.cancel_at_period_end,
      cancelAt: data.cancel_at,
      cancellationDate,
      isCancellationScheduled:
        data.cancel_at_period_end ||
        data.cancel_at !== null,
    },
  };
}