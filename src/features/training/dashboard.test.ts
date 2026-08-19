import { describe, expect, it } from "vitest";

import { buildSkillProfile } from "./skill-profile";
import {
  buildTrainingDashboard,
  DASHBOARD_RECENT_ATTEMPTS_LIMIT,
} from "./dashboard";
import type { TrainingHistoryAttempt } from "./history";

function createAttempt(
  overrides: Partial<TrainingHistoryAttempt>,
): TrainingHistoryAttempt {
  return {
    id: "attempt-1",
    exerciseId: "trend-continuation-001",
    exerciseTitle: "Escenario base",
    timeframe: "15m",
    decision: "long",
    confidence: 72,
    tradePlan: {
      entry: 100,
      stop: 95,
      target: 110,
    },
    ideaScore: 82,
    ideaRating: "strong",
    isTopRatedDecision: true,
    skillScores: [
      { skill: "context_reading", score: 82, weight: 1 },
      { skill: "discipline", score: 76, weight: 1 },
    ],
    ideaSummary: "Buena lectura.",
    ideaReasons: ["Respeta el contexto."],
    planScore: 78,
    planComponentScores: [
      { component: "entry", score: 80, weight: 1 },
      { component: "invalidation", score: 78, weight: 1 },
      { component: "target", score: 76, weight: 1 },
      { component: "reward_risk", score: 78, weight: 1 },
    ],
    managementScore: 74,
    managementActions: [],
    outcome: "target_hit",
    exitPrice: 110,
    createdAt: "2026-08-19T08:00:00.000Z",
    ...overrides,
  };
}

describe("buildTrainingDashboard", () => {
  it("returns an empty dashboard when there are no attempts", () => {
    const summary = buildTrainingDashboard([]);

    expect(summary.totalAttempts).toBe(0);
    expect(summary.attemptsAnalyzed).toBe(0);
    expect(summary.topRatedCount).toBe(0);
    expect(summary.recentAttempts).toHaveLength(0);
    expect(summary.skillMetrics).toHaveLength(0);
    expect(summary.stageMetrics.map((metric) => metric.score)).toEqual([
      null,
      null,
      null,
    ]);
  });

  it("calculates stage averages while excluding non-applicable scores", () => {
    const summary = buildTrainingDashboard([
      createAttempt({
        id: "a-1",
        ideaScore: 80,
        planScore: 70,
        managementScore: 60,
      }),
      createAttempt({
        id: "a-2",
        decision: "no_trade",
        tradePlan: null,
        ideaScore: 90,
        planScore: null,
        managementScore: null,
        planComponentScores: null,
        managementActions: [],
        outcome: "no_trade",
      }),
    ]);

    expect(summary.stageMetrics).toEqual([
      expect.objectContaining({ key: "idea", score: 85, attemptCount: 2 }),
      expect.objectContaining({ key: "plan", score: 70, attemptCount: 1 }),
      expect.objectContaining({ key: "management", score: 60, attemptCount: 1 }),
    ]);
  });

  it("uses the provided total attempt count when it is higher than the window", () => {
    const summary = buildTrainingDashboard([createAttempt({ id: "a-1" })], {
      totalAttempts: 14,
    });

    expect(summary.totalAttempts).toBe(14);
    expect(summary.attemptsAnalyzed).toBe(1);
  });

  it("sorts recent attempts from newest to oldest", () => {
    const summary = buildTrainingDashboard([
      createAttempt({ id: "older", createdAt: "2026-08-18T08:00:00.000Z" }),
      createAttempt({ id: "newer", createdAt: "2026-08-19T09:00:00.000Z" }),
    ]);

    expect(summary.recentAttempts.map((attempt) => attempt.id)).toEqual([
      "newer",
      "older",
    ]);
  });

  it("cuenta variantes procedurales con el mismo título como escenarios distintos", () => {
    const summary = buildTrainingDashboard([
      createAttempt({
        id: "a-1",
        exerciseId: "syn-range-midpoint-g1-s101",
        exerciseTitle: "Rango sin ventaja clara",
      }),
      createAttempt({
        id: "a-2",
        exerciseId: "syn-range-midpoint-g1-s202",
        exerciseTitle: "Rango sin ventaja clara",
      }),
    ]);

    expect(summary.uniqueExercises).toBe(2);
  });

  it("builds decision shares", () => {
    const summary = buildTrainingDashboard([
      createAttempt({ id: "a-1", decision: "long" }),
      createAttempt({ id: "a-2", decision: "short" }),
      createAttempt({
        id: "a-3",
        decision: "no_trade",
        tradePlan: null,
        planScore: null,
        managementScore: null,
        planComponentScores: null,
        managementActions: [],
        outcome: "no_trade",
      }),
    ]);

    expect(summary.decisionMetrics).toEqual([
      expect.objectContaining({ decision: "long", count: 1, share: 33 }),
      expect.objectContaining({ decision: "short", count: 1, share: 33 }),
      expect.objectContaining({ decision: "no_trade", count: 1, share: 33 }),
    ]);
  });

  it("surfaces skill signals from a supplied skill profile", () => {
    const attempts = [
      createAttempt({
        id: "a-1",
        exerciseId: "syn-trend-continuation-g1-s1",
        exerciseTitle: "Escenario 1",
        skillScores: [
          { skill: "context_reading", score: 88, weight: 1 },
          { skill: "discipline", score: 68, weight: 1 },
        ],
      }),
      createAttempt({
        id: "a-2",
        exerciseId: "syn-trend-continuation-g1-s2",
        exerciseTitle: "Escenario 2",
        skillScores: [
          { skill: "context_reading", score: 86, weight: 1 },
          { skill: "discipline", score: 62, weight: 1 },
        ],
      }),
    ];

    const summary = buildTrainingDashboard(attempts, {
      skillProfile: buildSkillProfile(
        attempts.map((attempt) => ({
          id: attempt.id,
          exerciseId: attempt.exerciseId,
          createdAt: attempt.createdAt,
          skillScores: attempt.skillScores,
        })),
      ),
    });

    expect(summary.strongestSkill).toEqual(
      expect.objectContaining({ skill: "context_reading", score: 87 }),
    );
    expect(summary.focusSkill).toEqual(
      expect.objectContaining({ skill: "discipline", score: 65 }),
    );
  });

  it("keeps up to twelve recent attempts for the scrollable dashboard history", () => {
    expect(DASHBOARD_RECENT_ATTEMPTS_LIMIT).toBe(12);

    const attempts = Array.from(
      { length: DASHBOARD_RECENT_ATTEMPTS_LIMIT + 2 },
      (_, index) =>
        createAttempt({
          id: `attempt-${index}`,
          createdAt: `2026-08-${String(10 + index).padStart(2, "0")}T08:00:00.000Z`,
        }),
    );

    const summary = buildTrainingDashboard(attempts);

    expect(summary.recentAttempts).toHaveLength(
      DASHBOARD_RECENT_ATTEMPTS_LIMIT,
    );
  });
  it("preserves the decision and marks standout recent attempts", () => {
    const summary = buildTrainingDashboard([
      createAttempt({
        id: "great-long",
        decision: "long",
        ideaScore: 82,
        planScore: 75,
        managementScore: 71,
      }),
      createAttempt({
        id: "borderline-short",
        decision: "short",
        ideaScore: 88,
        planScore: 70,
        managementScore: 92,
      }),
      createAttempt({
        id: "great-no-trade",
        decision: "no_trade",
        tradePlan: null,
        ideaScore: 91,
        planScore: null,
        managementScore: null,
        planComponentScores: null,
        managementActions: [],
        outcome: "no_trade",
      }),
    ]);

    const byId = new Map(summary.recentAttempts.map((attempt) => [attempt.id, attempt]));

    expect(byId.get("great-long")).toEqual(
      expect.objectContaining({ decision: "long", hasPerformanceSeal: true }),
    );
    expect(byId.get("borderline-short")).toEqual(
      expect.objectContaining({ decision: "short", hasPerformanceSeal: false }),
    );
    expect(byId.get("great-no-trade")).toEqual(
      expect.objectContaining({ decision: "no_trade", hasPerformanceSeal: true }),
    );
  });

});
