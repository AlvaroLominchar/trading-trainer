import type { Metadata } from "next";
import Link from "next/link";

import { TrainingHistory } from "@/components/training/training-history";
import {
  parseTrainingHistoryAttempt,
  TRAINING_HISTORY_LIMIT,
} from "@/features/training/history";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Historial",
  description:
    "Consulta tus intentos guardados y revisa por separado Lectura, Plan y Gestión.",
};

const HISTORY_SELECT = [
  "id",
  "exercise_title",
  "timeframe",
  "decision",
  "confidence",
  "trade_plan",
  "idea_score",
  "idea_rating",
  "is_top_rated_decision",
  "skill_scores",
  "idea_summary",
  "idea_reasons",
  "plan_score",
  "plan_component_scores",
  "management_score",
  "management_actions",
  "outcome",
  "exit_price",
  "created_at",
].join(", ");

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("training_attempts")
    .select(HISTORY_SELECT)
    .order("created_at", { ascending: false })
    .limit(TRAINING_HISTORY_LIMIT);

  if (error) {
    console.error("Training history query failed:", error);
  }

  const attempts = (data ?? [])
    .map((row) => parseTrainingHistoryAttempt(row))
    .filter((attempt) => attempt !== null);

  const invalidRowCount = (data?.length ?? 0) - attempts.length;

  if (invalidRowCount > 0) {
    console.error(
      `Training history skipped ${invalidRowCount} malformed persisted attempt(s).`,
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
      <header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div className="max-w-2xl">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-app-text-muted">
            Historial
          </span>
          <h1 className="mt-3 text-3xl font-medium tracking-[-0.05em] text-app-text sm:text-4xl">
            Revisa decisiones, no solo desenlaces.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-app-text-soft">
            Cada intento conserva la evaluación real de Lectura, Plan y Gestión para que puedas volver a estudiar cómo tomaste la decisión.
          </p>
        </div>

        <Link
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-app-accent px-5 text-sm font-semibold text-app-accent-text transition duration-200 hover:bg-app-accent-hover"
          href="/train"
        >
          Entrenar ahora
        </Link>
      </header>

      <TrainingHistory attempts={attempts} unavailable={Boolean(error)} />
    </main>
  );
}
