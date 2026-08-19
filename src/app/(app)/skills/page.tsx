import type { Metadata } from "next";
import Link from "next/link";

import { TrainingSkillProfile } from "@/components/training/skill-profile";
import {
  buildSkillProfile,
  parseSkillProfileAttempt,
  SKILL_PROFILE_ATTEMPT_LIMIT,
  type SkillProfileAttempt,
} from "@/features/training/skill-profile";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Perfil de habilidades",
  description:
    "Consulta cómo se distribuye tu evidencia reciente por habilidades de entrenamiento.",
};

const SKILL_PROFILE_SELECT = [
  "id",
  "exercise_id",
  "skill_scores",
  "plan_component_scores",
  "created_at",
].join(", ");

export default async function SkillsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("training_attempts")
    .select(SKILL_PROFILE_SELECT)
    .order("created_at", { ascending: false })
    .limit(SKILL_PROFILE_ATTEMPT_LIMIT);

  if (error) {
    console.error("Training skill profile query failed:", error);
  }

  const attempts = (data ?? [])
    .map((row: unknown) => parseSkillProfileAttempt(row))
    .filter(
      (attempt: SkillProfileAttempt | null): attempt is SkillProfileAttempt =>
        attempt !== null,
    );

  const invalidRowCount = (data?.length ?? 0) - attempts.length;

  if (invalidRowCount > 0) {
    console.error(
      `Training skill profile skipped ${invalidRowCount} malformed persisted attempt(s).`,
    );
  }

  const profile = buildSkillProfile(attempts);

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
      <header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div className="max-w-2xl">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-app-text-muted">
            Perfil de habilidades
          </span>
          <h1 className="mt-3 text-3xl font-medium tracking-[-0.05em] text-app-text sm:text-4xl">
            Mira dónde se repite tu calidad de decisión.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-app-text-soft">
            Agrupamos únicamente las habilidades que tus escenarios han evaluado. No existe una nota global de trader ni una conclusión basada en un solo ejercicio.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-app-border px-4 text-xs font-medium text-app-text-soft transition duration-200 hover:border-app-border-strong hover:bg-app-surface-hover hover:text-app-text"
            href="/history"
          >
            Ver historial
          </Link>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-app-accent px-5 text-sm font-semibold text-app-accent-text transition duration-200 hover:bg-app-accent-hover"
            href="/train"
          >
            Entrenar ahora
          </Link>
        </div>
      </header>

      <TrainingSkillProfile
        profile={profile}
        unavailable={Boolean(error)}
      />
    </main>
  );
}
