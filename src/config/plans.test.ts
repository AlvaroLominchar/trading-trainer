import { describe, expect, it } from "vitest";

import {
  ACCOUNT_PLANS,
  getExpectedMonthlyAmount,
  getPlanFallbackPriceLabel,
  getPlanLabel,
  hasMinimumPlan,
  isAccountPlan,
  isPaidPlan,
  normalizeAccountPlan,
} from "./plans";

describe("plan catalog", () => {
  it("keeps the expected plan order", () => {
    expect(ACCOUNT_PLANS).toEqual([
      "free",
      "plus",
      "premium",
    ]);
  });

  it("recognizes valid account plans", () => {
    expect(isAccountPlan("free")).toBe(true);
    expect(isAccountPlan("plus")).toBe(true);
    expect(isAccountPlan("premium")).toBe(true);
    expect(isAccountPlan("pro")).toBe(false);
    expect(isAccountPlan(null)).toBe(false);
  });

  it("recognizes only paid plans", () => {
    expect(isPaidPlan("free")).toBe(false);
    expect(isPaidPlan("plus")).toBe(true);
    expect(isPaidPlan("premium")).toBe(true);
    expect(isPaidPlan("pro")).toBe(false);
  });

  it("normalizes unknown database values to free", () => {
    expect(normalizeAccountPlan("premium")).toBe(
      "premium",
    );
    expect(normalizeAccountPlan("unexpected")).toBe(
      "free",
    );
    expect(normalizeAccountPlan(undefined)).toBe(
      "free",
    );
  });

  it("returns labels and fallback prices", () => {
    expect(getPlanLabel("free")).toBe("Free");
    expect(getPlanLabel("plus")).toBe("Plus");
    expect(getPlanLabel("premium")).toBe("Premium");

    expect(
      getPlanFallbackPriceLabel("free"),
    ).toBe("0 €");
    expect(
      getPlanFallbackPriceLabel("plus"),
    ).toBe("4,99 €/mes");
    expect(
      getPlanFallbackPriceLabel("premium"),
    ).toBe("19,99 €/mes");
  });

  it("returns the expected Stripe monthly amounts", () => {
    expect(getExpectedMonthlyAmount("plus")).toBe(
      499,
    );
    expect(
      getExpectedMonthlyAmount("premium"),
    ).toBe(1999);
  });

  it("compares minimum plan access by rank", () => {
    expect(hasMinimumPlan("free", "free")).toBe(true);
    expect(hasMinimumPlan("free", "plus")).toBe(false);
    expect(
      hasMinimumPlan("free", "premium"),
    ).toBe(false);

    expect(hasMinimumPlan("plus", "free")).toBe(true);
    expect(hasMinimumPlan("plus", "plus")).toBe(true);
    expect(
      hasMinimumPlan("plus", "premium"),
    ).toBe(false);

    expect(
      hasMinimumPlan("premium", "free"),
    ).toBe(true);
    expect(
      hasMinimumPlan("premium", "plus"),
    ).toBe(true);
    expect(
      hasMinimumPlan("premium", "premium"),
    ).toBe(true);
  });
});
