"use server";

import { createHash } from "node:crypto";

import {
  evaluateTrainingAttemptSubmission,
  type TrainingAttemptSubmission,
} from "@/features/training/attempt-persistence";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type SaveTrainingAttemptResult = {
  status: "saved" | "error";
  message: string;
};

function getSubmissionFingerprint(
  attempt: ReturnType<typeof evaluateTrainingAttemptSubmission>,
) {
  return createHash("sha256")
    .update(JSON.stringify(attempt))
    .digest("hex");
}

export async function saveTrainingAttempt(
  submission: TrainingAttemptSubmission,
): Promise<SaveTrainingAttemptResult> {
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

  let attempt: ReturnType<typeof evaluateTrainingAttemptSubmission>;

  try {
    attempt = evaluateTrainingAttemptSubmission(submission);
  } catch (error) {
    console.error("Training attempt validation failed:", error);

    return {
      status: "error",
      message: "No se pudo validar este intento de entrenamiento.",
    };
  }

  const submissionFingerprint = getSubmissionFingerprint(attempt);
  const supabaseAdmin = getSupabaseAdminClient();
  const { error: insertError } = await supabaseAdmin
    .from("training_attempts")
    .insert({
      id: attempt.attemptId,
      user_id: user.id,
      submission_fingerprint: submissionFingerprint,
      exercise_id: attempt.exerciseId,
      exercise_version: attempt.exerciseVersion,
      exercise_title: attempt.exerciseTitle,
      timeframe: attempt.timeframe,
      source_kind: attempt.sourceKind,
      rubric_version: attempt.rubricVersion,
      management_rubric_version: attempt.managementRubricVersion,
      decision: attempt.decision,
      confidence: attempt.confidence,
      trade_plan: attempt.tradePlan,
      idea_score: attempt.ideaScore,
      idea_rating: attempt.ideaRating,
      is_top_rated_decision: attempt.isTopRatedDecision,
      skill_scores: attempt.skillScores,
      idea_summary: attempt.ideaSummary,
      idea_reasons: attempt.ideaReasons,
      plan_score: attempt.planScore,
      plan_component_scores: attempt.planComponentScores,
      management_score: attempt.managementScore,
      management_actions: attempt.managementActions,
      outcome: attempt.outcome,
      exit_price: attempt.exitPrice,
    });

  if (!insertError) {
    return {
      status: "saved",
      message: "Intento guardado.",
    };
  }

  if (insertError.code !== "23505") {
    console.error("Training attempt insert failed:", insertError);

    return {
      status: "error",
      message: "No se pudo guardar el intento. Inténtalo de nuevo.",
    };
  }

  const { data: existingAttempt, error: existingAttemptError } =
    await supabaseAdmin
      .from("training_attempts")
      .select("submission_fingerprint")
      .eq("id", attempt.attemptId)
      .eq("user_id", user.id)
      .maybeSingle<{ submission_fingerprint: string }>();

  if (existingAttemptError) {
    console.error(
      "Training attempt idempotency lookup failed:",
      existingAttemptError,
    );

    return {
      status: "error",
      message: "No se pudo confirmar el guardado del intento.",
    };
  }

  if (
    existingAttempt?.submission_fingerprint === submissionFingerprint
  ) {
    return {
      status: "saved",
      message: "Intento guardado.",
    };
  }

  console.error(
    "Training attempt id collision with a different submission:",
    attempt.attemptId,
  );

  return {
    status: "error",
    message: "Este intento no pudo guardarse de forma segura.",
  };
}
