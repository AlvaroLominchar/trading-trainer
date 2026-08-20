import { describe, expect, it } from "vitest";

import { getAdaptiveSelectionPreferences } from "./adaptive-selection";
import type { SkillProfile, SkillProfileMetric } from "./skill-profile";
import { TRAINING_SKILLS, type TrainingSkill } from "./types";

function metric(
  skill: TrainingSkill,
  {
    score = 70,
    observations = 4,
    uniqueExercises = 4,
    recentScores = [70, 70, 70],
  }: Partial<Pick<
    SkillProfileMetric,
    "score" | "observations" | "uniqueExercises" | "recentScores"
  >> = {},
): SkillProfileMetric {
  return {
    skill,
    score,
    latestScore: recentScores.at(-1) ?? score,
    observations,
    uniqueExercises,
    recentScores,
  };
}

function profile(
  overrides: Partial<Record<TrainingSkill, Partial<SkillProfileMetric>>> = {},
  attemptsAnalyzed = 30,
  defaultScore = 72,
): SkillProfile {
  const metrics = TRAINING_SKILLS.map((skill) => {
    const override = overrides[skill] ?? {};
    return metric(skill, {
      score: override.score ?? defaultScore,
      observations: override.observations ?? 4,
      uniqueExercises: override.uniqueExercises ?? 4,
      recentScores:
        override.recentScores ?? [defaultScore, defaultScore, defaultScore],
    });
  });

  return {
    attemptsAnalyzed,
    uniqueExercises: attemptsAnalyzed,
    skillsMeasured: metrics.filter((item) => item.score !== null).length,
    metrics,
    strongestSkill: null,
    focusSkill: null,
  };
}

describe("adaptive selection preferences", () => {
  it("prioriza cobertura antes de declarar una debilidad con poca evidencia", () => {
    const input = profile({
      volatility_reading: {
        score: null,
        observations: 0,
        uniqueExercises: 0,
        recentScores: [],
      },
    });

    const result = getAdaptiveSelectionPreferences(input, 1234);

    expect(result.strategy).toBe("coverage");
    expect(result.targetSkill).toBe("volatility_reading");
  });

  it("prioriza una habilidad débil sin convertir el selector en una repetición rígida", () => {
    const input = profile({
      range_reading: {
        score: 48,
        recentScores: [55, 48, 42],
      },
      trend_reading: {
        score: 88,
        recentScores: [84, 88, 92],
      },
    });
    let rangeTargets = 0;

    for (let seed = 1; seed <= 100; seed += 1) {
      const result = getAdaptiveSelectionPreferences(input, seed);

      expect(result.strategy).toBe("reinforcement");

      if (result.targetSkill === "range_reading") {
        rangeTargets += 1;
        expect(result.targetDifficulty).toBe("easy");
      }
    }

    expect(rangeTargets).toBeGreaterThanOrEqual(55);
  });

  it("reacciona a errores recientes sin depender solo de la media histórica", () => {
    const input = profile({
      false_breakout: {
        score: 70,
        recentScores: [70, 38, 35],
      },
      range_reading: {
        score: 64,
        recentScores: [66, 66, 66],
      },
    });
    let falseBreakoutTargets = 0;

    for (let seed = 1; seed <= 100; seed += 1) {
      if (
        getAdaptiveSelectionPreferences(input, seed).targetSkill ===
        "false_breakout"
      ) {
        falseBreakoutTargets += 1;
      }
    }

    expect(falseBreakoutTargets).toBeGreaterThanOrEqual(55);
  });

  it("solo sube a difícil cuando hay rendimiento alto y evidencia suficiente", () => {
    const input = profile(
      {
        retest_reading: {
          score: 84,
          observations: 7,
          uniqueExercises: 6,
          recentScores: [84, 86, 88],
        },
      },
      30,
      90,
    );
    const hardTarget = Array.from({ length: 100 }, (_, index) =>
      getAdaptiveSelectionPreferences(input, index + 1),
    ).find((result) => result.targetSkill === "retest_reading");

    expect(hardTarget?.targetDifficulty).toBe("hard");
  });

  it("mantiene dificultad intermedia para una debilidad defendible", () => {
    const input = profile(
      {
        exhaustion_reading: {
          score: 68,
          observations: 6,
          uniqueExercises: 5,
          recentScores: [64, 68, 70],
        },
      },
      30,
      80,
    );
    const mediumTarget = Array.from({ length: 100 }, (_, index) =>
      getAdaptiveSelectionPreferences(input, index + 1),
    ).find((result) => result.targetSkill === "exhaustion_reading");

    expect(mediumTarget?.targetDifficulty).toBe("medium");
  });

  it("evita insistir inmediatamente en la skill principal del ejercicio anterior", () => {
    const input = profile({
      range_reading: {
        score: 45,
        recentScores: [50, 46, 40],
      },
      volatility_reading: {
        score: 58,
        recentScores: [60, 58, 56],
      },
    });

    for (let seed = 1; seed <= 30; seed += 1) {
      expect(
        getAdaptiveSelectionPreferences(input, seed, {
          avoidSkill: "range_reading",
        }).targetSkill,
      ).not.toBe("range_reading");
    }
  });

  it("es determinista para el mismo perfil y seed", () => {
    const input = profile();

    expect(getAdaptiveSelectionPreferences(input, 99881)).toEqual(
      getAdaptiveSelectionPreferences(input, 99881),
    );
  });
});
