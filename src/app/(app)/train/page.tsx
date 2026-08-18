import type { Metadata } from "next";

import { TrainingSession } from "@/components/training/training-session";

export const metadata: Metadata = {
  title: "Entrenar",
  description:
    "Entrena toma de decisiones con escenarios controlados y feedback explicable.",
};

export default function TrainPage() {
  return <TrainingSession />;
}
