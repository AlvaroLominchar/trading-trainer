"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type CompleteOnboardingState = {
  status: "idle" | "error";
  message: string;
};

export async function completeOnboarding(
  _previousState: CompleteOnboardingState,
  _formData: FormData,
): Promise<CompleteOnboardingState> {
  void _previousState;
  void _formData;

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

  const { data: completed, error } =
    await supabase.rpc(
      "complete_profile_onboarding",
    );

  if (error || completed !== true) {
    console.error(
      "Profile onboarding completion failed:",
      error,
    );

    return {
      status: "error",
      message:
        "No se pudo completar la bienvenida. Inténtalo de nuevo.",
    };
  }

  redirect("/dashboard");
}
