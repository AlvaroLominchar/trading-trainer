
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { OnboardingCard } from "@/components/app/onboarding-card";
import { TrainingDashboard } from "@/components/training/training-dashboard";
import {
  buildTrainingDashboard,
  DASHBOARD_ATTEMPT_WINDOW,
} from "@/features/training/dashboard";
import {
  parseTrainingHistoryAttempt,
  type TrainingHistoryAttempt,
} from "@/features/training/history";
import {
  buildSkillProfile,
  parseSkillProfileAttempt,
  type SkillProfileAttempt,
} from "@/features/training/skill-profile";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Resumen principal de entrenamiento, rendimiento, decisiones, historial y habilidades.",
};

const DASHBOARD_SELECT = [
  "id",
  "exercise_id",
  "exercise_title",
  "timeframe",
  "decision",
  "confidence",
  "wait_count",
  "trade_plan",
  "idea_score",
  "idea_rating",
  "is_top_rated_decision",
  "skill_scores",
  "idea_summary",
  "idea_reasons",
  "plan_score",
  "plan_component_scores",
  "timing_score",
  "management_score",
  "management_actions",
  "outcome",
  "exit_price",
  "created_at",
].join(", ");

export default async function DashboardPage() {
  const currentProfile = await getCurrentProfile();

  if (!currentProfile) {
    redirect("/login");
  }

  const { profile } = currentProfile;
  const supabase = await createClient();

  const { data, error, count } = await supabase
    .from("training_attempts")
    .select(DASHBOARD_SELECT, { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(DASHBOARD_ATTEMPT_WINDOW);

  if (error) {
    console.error("Training dashboard query failed:", error);
  }

  const rows = data ?? [];
  const attempts = rows
    .map((row: unknown) => parseTrainingHistoryAttempt(row))
    .filter(
      (attempt: TrainingHistoryAttempt | null): attempt is TrainingHistoryAttempt =>
        attempt !== null,
    );
  const skillProfileAttempts = rows
    .map((row: unknown) => parseSkillProfileAttempt(row))
    .filter(
      (attempt: SkillProfileAttempt | null): attempt is SkillProfileAttempt =>
        attempt !== null,
    );

  const malformedHistoryRows = rows.length - attempts.length;

  if (malformedHistoryRows > 0) {
    console.error(
      `Training dashboard skipped ${malformedHistoryRows} malformed persisted attempt(s).`,
    );
  }

  const malformedSkillRows = rows.length - skillProfileAttempts.length;

  if (malformedSkillRows > 0) {
    console.error(
      `Training dashboard skipped ${malformedSkillRows} malformed skill-profile attempt(s).`,
    );
  }

  const summary = buildTrainingDashboard(attempts, {
    totalAttempts: count ?? attempts.length,
    skillProfile: buildSkillProfile(skillProfileAttempts),
  });

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
      <header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div className="max-w-2xl">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-app-text-muted">
            Dashboard
          </span>
          <h1 className="mt-3 text-3xl font-medium tracking-[-0.05em] text-app-text sm:text-4xl">
            Hola, {profile.firstName}. ¿Seguimos entrenando?
          </h1>
          <p className="mt-3 text-sm leading-6 text-app-text-soft">
            Un vistazo rápido a cómo estás resolviendo tus ejercicios.
          </p>
        </div>

        <Link
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-app-accent px-5 text-sm font-semibold text-app-accent-text transition duration-200 hover:bg-app-accent-hover"
          href="/train"
        >
          Entrenar ahora
        </Link>
      </header>

      {!profile.onboardingCompleted ? (
        <OnboardingCard firstName={profile.firstName} />
      ) : null}

      <TrainingDashboard
        summary={summary}
        unavailable={Boolean(error)}
      />
    </main>
  );
}
