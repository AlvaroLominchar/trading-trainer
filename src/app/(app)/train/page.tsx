import type { Metadata } from "next";

import { TrainingSession } from "@/components/training/training-session";
import {
  createSyntheticSelectionSeed,
  selectSyntheticExercise,
  SYNTHETIC_RECENT_EXERCISE_LIMIT,
} from "@/features/training/exercises/synthetic-catalog";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Entrenar",
  description:
    "Entrena toma de decisiones con escenarios sintéticos reproducibles y feedback explicable.",
};

export default async function TrainPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("training_attempts")
    .select("exercise_id")
    .order("created_at", { ascending: false })
    .limit(SYNTHETIC_RECENT_EXERCISE_LIMIT);

  if (error) {
    console.error("Recent training exercise lookup failed:", error);
  }

  const recentExerciseIds = (data ?? [])
    .map((row) => row.exercise_id)
    .filter((exerciseId): exerciseId is string => typeof exerciseId === "string");
  const initialExercise = selectSyntheticExercise({
    recentExerciseIds,
    selectionSeed: createSyntheticSelectionSeed([
      user?.id ?? "anonymous",
      ...recentExerciseIds,
    ]),
  });

  return (
    <TrainingSession
      initialExercise={initialExercise}
      initialRecentExerciseIds={recentExerciseIds}
    />
  );
}
