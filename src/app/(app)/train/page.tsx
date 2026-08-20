import type { Metadata } from "next";

import { TrainingSession } from "@/components/training/training-session";
import { getAdaptiveSelectionPreferences } from "@/features/training/adaptive-selection";
import {
  createSyntheticSelectionSeed,
  selectSyntheticExercise,
  SYNTHETIC_RECENT_EXERCISE_LIMIT,
} from "@/features/training/exercises/synthetic-catalog";
import {
  buildSkillProfile,
  parseSkillProfileAttempt,
  SKILL_PROFILE_ATTEMPT_LIMIT,
  type SkillProfileAttempt,
} from "@/features/training/skill-profile";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Entrenar",
  description:
    "Entrena toma de decisiones con escenarios sintéticos reproducibles y feedback explicable.",
};

const TRAINING_SELECTION_SELECT =
  "id, exercise_id, skill_scores, plan_component_scores, timing_score, created_at";

export default async function TrainPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("training_attempts")
    .select(TRAINING_SELECTION_SELECT)
    .order("created_at", { ascending: false })
    .limit(SYNTHETIC_RECENT_EXERCISE_LIMIT);

  if (error) {
    console.error("Recent training exercise lookup failed:", error);
  }

  const rows = data ?? [];
  const recentExerciseIds = rows
    .map((row) => row.exercise_id)
    .filter((exerciseId): exerciseId is string => typeof exerciseId === "string");
  const adaptiveAttempts = rows
    .map((row: unknown) => parseSkillProfileAttempt(row))
    .filter(
      (attempt: SkillProfileAttempt | null): attempt is SkillProfileAttempt =>
        attempt !== null,
    )
    .slice(0, SKILL_PROFILE_ATTEMPT_LIMIT);
  const selectionSeed = createSyntheticSelectionSeed([
    user?.id ?? "anonymous",
    ...recentExerciseIds,
  ]);
  const adaptivePreferences = getAdaptiveSelectionPreferences(
    buildSkillProfile(adaptiveAttempts),
    selectionSeed,
  );
  const initialExercise = selectSyntheticExercise({
    recentExerciseIds,
    selectionSeed,
    adaptivePreferences,
  });

  return (
    <TrainingSession
      initialAdaptiveAttempts={adaptiveAttempts}
      initialExercise={initialExercise}
      initialRecentExerciseIds={recentExerciseIds}
    />
  );
}
