"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type UpdateProfileState = {
  status: "idle" | "success" | "error";
  message: string;
};

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

  const fullName = fullNameValue.trim().replace(/\s+/g, " ");

  if (fullName.length < 2) {
    return {
      status: "error",
      message: "El nombre debe contener al menos 2 caracteres.",
    };
  }

  if (fullName.length > 80) {
    return {
      status: "error",
      message: "El nombre no puede superar los 80 caracteres.",
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
      message: "Tu sesión no es válida. Vuelve a iniciar sesión.",
    };
  }

  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
    })
    .eq("id", user.id)
    .select("id")
    .single();

  if (updateError || !updatedProfile) {
    console.error("Profile update failed:", updateError);

    return {
      status: "error",
      message: "No se pudo guardar el perfil. Inténtalo de nuevo.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings");

  return {
    status: "success",
    message: "Perfil actualizado correctamente.",
  };
}