import type { User } from "@supabase/supabase-js";

function getMetadataString(
  metadata: User["user_metadata"],
  keys: string[],
) {
  for (const key of keys) {
    const value = metadata?.[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

export function getUserProfile(user: User) {
  const email = user.email ?? "Sin correo";

  const fallbackName = email.includes("@")
    ? email.split("@")[0]
    : "Usuario";

  const displayName =
    getMetadataString(user.user_metadata, ["full_name", "name"]) ??
    fallbackName;

  const firstName = displayName.split(/\s+/)[0] || "Usuario";

  const avatarUrl = getMetadataString(user.user_metadata, [
    "avatar_url",
    "picture",
  ]);

  const initial = displayName.charAt(0).toUpperCase() || "U";

  return {
    displayName,
    firstName,
    email,
    avatarUrl,
    initial,
  };
}