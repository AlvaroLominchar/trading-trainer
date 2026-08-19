import { describe, expect, it } from "vitest";

import {
  buildSkillProfile,
  parseSkillProfileAttempt,
} from "./skill-profile";

function row({
  id,
  exerciseId,
  createdAt,
  skills,
}: {
  id: string;
  exerciseId: string;
  createdAt: string;
  skills: Array<{ skill: string; score: number; weight?: number }>;
}) {
  return {
    id,
    exercise_id: exerciseId,
    created_at: createdAt,
    skill_scores: skills.map((skill) => ({
      ...skill,
      weight: skill.weight ?? 1,
    })),
  };
}

describe("parseSkillProfileAttempt", () => {
  it("normaliza únicamente la evidencia necesaria para el perfil", () => {
    const result = parseSkillProfileAttempt(
      row({
        id: "a",
        exerciseId: "scenario-a",
        createdAt: "2026-08-19T08:00:00.000Z",
        skills: [
          { skill: "context_reading", score: 82, weight: 0.4 },
          { skill: "discipline", score: 74, weight: 0.6 },
        ],
      }),
    );

    expect(result?.exerciseId).toBe("scenario-a");
    expect(result?.skillScores).toHaveLength(2);
  });

  it("conserva una puntuación cero válida", () => {
    const result = parseSkillProfileAttempt(
      row({
        id: "a",
        exerciseId: "scenario-a",
        createdAt: "2026-08-19T08:00:00.000Z",
        skills: [{ skill: "discipline", score: 0 }],
      }),
    );

    expect(result?.skillScores[0]?.score).toBe(0);
  });

  it("rechaza skills duplicadas dentro del mismo intento", () => {
    const result = parseSkillProfileAttempt(
      row({
        id: "a",
        exerciseId: "scenario-a",
        createdAt: "2026-08-19T08:00:00.000Z",
        skills: [
          { skill: "discipline", score: 80 },
          { skill: "discipline", score: 70 },
        ],
      }),
    );

    expect(result).toBeNull();
  });

  it("rechaza fechas, scores o skills inválidos", () => {
    expect(
      parseSkillProfileAttempt(
        row({
          id: "a",
          exerciseId: "scenario-a",
          createdAt: "not-a-date",
          skills: [{ skill: "discipline", score: 80 }],
        }),
      ),
    ).toBeNull();

    expect(
      parseSkillProfileAttempt(
        row({
          id: "b",
          exerciseId: "scenario-a",
          createdAt: "2026-08-19T08:00:00.000Z",
          skills: [{ skill: "discipline", score: 101 }],
        }),
      ),
    ).toBeNull();

    expect(
      parseSkillProfileAttempt(
        row({
          id: "c",
          exerciseId: "scenario-a",
          createdAt: "2026-08-19T08:00:00.000Z",
          skills: [{ skill: "unknown", score: 80 }],
        }),
      ),
    ).toBeNull();
  });
});

describe("buildSkillProfile", () => {
  it("promedia cada observación por igual sin reutilizar el peso del ejercicio", () => {
    const attempts = [
      parseSkillProfileAttempt(
        row({
          id: "new",
          exerciseId: "scenario-b",
          createdAt: "2026-08-19T09:00:00.000Z",
          skills: [{ skill: "context_reading", score: 100, weight: 0.1 }],
        }),
      ),
      parseSkillProfileAttempt(
        row({
          id: "old",
          exerciseId: "scenario-a",
          createdAt: "2026-08-19T08:00:00.000Z",
          skills: [{ skill: "context_reading", score: 0, weight: 0.9 }],
        }),
      ),
    ].filter((attempt) => attempt !== null);

    const profile = buildSkillProfile(attempts);
    const context = profile.metrics.find(
      (metric) => metric.skill === "context_reading",
    );

    expect(context?.score).toBe(50);
    expect(context?.observations).toBe(2);
    expect(context?.uniqueExercises).toBe(2);
  });

  it("mantiene los puntos recientes en orden cronológico para mostrarlos", () => {
    const attempts = [
      parseSkillProfileAttempt(
        row({
          id: "new",
          exerciseId: "scenario-c",
          createdAt: "2026-08-19T10:00:00.000Z",
          skills: [{ skill: "discipline", score: 90 }],
        }),
      ),
      parseSkillProfileAttempt(
        row({
          id: "middle",
          exerciseId: "scenario-b",
          createdAt: "2026-08-19T09:00:00.000Z",
          skills: [{ skill: "discipline", score: 70 }],
        }),
      ),
      parseSkillProfileAttempt(
        row({
          id: "old",
          exerciseId: "scenario-a",
          createdAt: "2026-08-19T08:00:00.000Z",
          skills: [{ skill: "discipline", score: 50 }],
        }),
      ),
    ].filter((attempt) => attempt !== null);

    const discipline = buildSkillProfile(attempts).metrics.find(
      (metric) => metric.skill === "discipline",
    );

    expect(discipline?.recentScores).toEqual([50, 70, 90]);
    expect(discipline?.latestScore).toBe(90);
  });

  it("solo genera una señal fuerte/débil con evidencia diversa y separación suficiente", () => {
    const attempts = [
      parseSkillProfileAttempt(
        row({
          id: "a2",
          exerciseId: "scenario-b",
          createdAt: "2026-08-19T10:00:00.000Z",
          skills: [
            { skill: "context_reading", score: 90 },
            { skill: "discipline", score: 60 },
          ],
        }),
      ),
      parseSkillProfileAttempt(
        row({
          id: "a1",
          exerciseId: "scenario-a",
          createdAt: "2026-08-19T09:00:00.000Z",
          skills: [
            { skill: "context_reading", score: 80 },
            { skill: "discipline", score: 70 },
          ],
        }),
      ),
    ].filter((attempt) => attempt !== null);

    const profile = buildSkillProfile(attempts);

    expect(profile.strongestSkill?.skill).toBe("context_reading");
    expect(profile.focusSkill?.skill).toBe("discipline");
  });

  it("no convierte repeticiones del mismo escenario en una conclusión de perfil", () => {
    const attempts = [
      parseSkillProfileAttempt(
        row({
          id: "a2",
          exerciseId: "same-scenario",
          createdAt: "2026-08-19T10:00:00.000Z",
          skills: [
            { skill: "context_reading", score: 95 },
            { skill: "discipline", score: 55 },
          ],
        }),
      ),
      parseSkillProfileAttempt(
        row({
          id: "a1",
          exerciseId: "same-scenario",
          createdAt: "2026-08-19T09:00:00.000Z",
          skills: [
            { skill: "context_reading", score: 95 },
            { skill: "discipline", score: 55 },
          ],
        }),
      ),
    ].filter((attempt) => attempt !== null);

    const profile = buildSkillProfile(attempts);

    expect(profile.strongestSkill).toBeNull();
    expect(profile.focusSkill).toBeNull();
  });
});
