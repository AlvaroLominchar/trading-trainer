import "server-only";

import { redirect } from "next/navigation";

import {
  hasMinimumPlan,
  type AccountPlan,
} from "@/config/plans";
import { getCurrentProfile } from "@/lib/auth/current-profile";

export type CurrentPlanAccess = {
  authenticated: boolean;
  currentPlan: AccountPlan | null;
  requiredPlan: AccountPlan;
  granted: boolean;
};

export async function getCurrentPlanAccess(
  requiredPlan: AccountPlan,
): Promise<CurrentPlanAccess> {
  const currentProfile = await getCurrentProfile();

  if (!currentProfile) {
    return {
      authenticated: false,
      currentPlan: null,
      requiredPlan,
      granted: false,
    };
  }

  return {
    authenticated: true,
    currentPlan: currentProfile.profile.plan,
    requiredPlan,
    granted: hasMinimumPlan(
      currentProfile.profile.plan,
      requiredPlan,
    ),
  };
}

export async function requireMinimumPlan(
  requiredPlan: AccountPlan,
) {
  const currentProfile = await getCurrentProfile();

  if (!currentProfile) {
    redirect("/login");
  }

  if (
    !hasMinimumPlan(
      currentProfile.profile.plan,
      requiredPlan,
    )
  ) {
    redirect("/settings");
  }

  return currentProfile;
}
