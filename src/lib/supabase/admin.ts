import "server-only";

import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

type SupabaseAdminEnvironmentVariable =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "SUPABASE_SECRET_KEY";

function getRequiredEnvironmentVariable(
  name: SupabaseAdminEnvironmentVariable,
) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Falta la variable de entorno obligatoria: ${name}`,
    );
  }

  return value;
}

let supabaseAdminClient: SupabaseClient | null = null;

export function getSupabaseAdminClient() {
  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(
      getRequiredEnvironmentVariable(
        "NEXT_PUBLIC_SUPABASE_URL",
      ),
      getRequiredEnvironmentVariable(
        "SUPABASE_SECRET_KEY",
      ),
      {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: false,
        },
      },
    );
  }

  return supabaseAdminClient;
}