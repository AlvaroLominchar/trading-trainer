export const ACCOUNT_PLANS = [
  "free",
  "plus",
  "premium",
] as const;

export type AccountPlan =
  (typeof ACCOUNT_PLANS)[number];

export const PAID_PLANS = [
  "plus",
  "premium",
] as const;

export type PaidPlan =
  (typeof PAID_PLANS)[number];

type PlanDefinition = {
  label: string;
  rank: number;
  monthlyAmountCents: number | null;
  fallbackPriceLabel: string;
};

export const PLAN_CATALOG = {
  free: {
    label: "Free",
    rank: 0,
    monthlyAmountCents: null,
    fallbackPriceLabel: "0 €",
  },
  plus: {
    label: "Plus",
    rank: 1,
    monthlyAmountCents: 499,
    fallbackPriceLabel: "4,99 €/mes",
  },
  premium: {
    label: "Premium",
    rank: 2,
    monthlyAmountCents: 1999,
    fallbackPriceLabel: "19,99 €/mes",
  },
} as const satisfies Record<
  AccountPlan,
  PlanDefinition
>;

export function isAccountPlan(
  value: unknown,
): value is AccountPlan {
  return (
    value === "free" ||
    value === "plus" ||
    value === "premium"
  );
}

export function isPaidPlan(
  value: unknown,
): value is PaidPlan {
  return value === "plus" || value === "premium";
}

export function normalizeAccountPlan(
  value: unknown,
): AccountPlan {
  return isAccountPlan(value) ? value : "free";
}

export function getPlanLabel(
  plan: AccountPlan,
) {
  return PLAN_CATALOG[plan].label;
}

export function getPlanFallbackPriceLabel(
  plan: AccountPlan,
) {
  return PLAN_CATALOG[plan].fallbackPriceLabel;
}

export function getExpectedMonthlyAmount(
  plan: PaidPlan,
) {
  return PLAN_CATALOG[plan].monthlyAmountCents;
}

export function hasMinimumPlan(
  currentPlan: AccountPlan,
  requiredPlan: AccountPlan,
) {
  return (
    PLAN_CATALOG[currentPlan].rank >=
    PLAN_CATALOG[requiredPlan].rank
  );
}
