import { normalizeAccountPlan } from "@/config/plans";
import { getUserProfile } from "@/lib/auth/user-profile";
import { createClient } from "@/lib/supabase/server";

type DatabaseProfile = {
  full_name: string | null;
  avatar_url: string | null;
  plan: string;
  onboarding_completed_at: string | null;
};

export async function getCurrentProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const authProfile = getUserProfile(user);

  const {
    data: databaseProfile,
    error,
  } = await supabase
    .from("profiles")
    .select(
      [
        "full_name",
        "avatar_url",
        "plan",
        "onboarding_completed_at",
      ].join(", "),
    )
    .eq("id", user.id)
    .maybeSingle<DatabaseProfile>();

  const displayName =
    databaseProfile?.full_name?.trim() ||
    authProfile.displayName;

  const avatarUrl =
    databaseProfile?.avatar_url?.trim() ||
    authProfile.avatarUrl;

  const plan = normalizeAccountPlan(
    databaseProfile?.plan,
  );

  const firstName =
    displayName.split(/\s+/)[0] || "Usuario";

  const initial =
    displayName.charAt(0).toUpperCase() || "U";

  return {
    user,
    databaseConnected:
      !error && databaseProfile !== null,
    profile: {
      displayName,
      firstName,
      email: authProfile.email,
      avatarUrl,
      initial,
      plan,
      onboardingCompleted:
        databaseProfile === null ||
        databaseProfile === undefined ||
        databaseProfile.onboarding_completed_at !== null,
    },
  };
}
