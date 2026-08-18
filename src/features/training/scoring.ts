import type {
  AttemptRating,
  DecisionRubric,
  Exercise,
  ExerciseAttemptInput,
  ExerciseAttemptResult,
  ExerciseSkillWeight,
  SkillScore,
  TrainingDecision,
} from "./types";

function assertScore(score: number, label: string) {
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new RangeError(`${label} must be between 0 and 100.`);
  }
}

function assertExerciseSkills(skills: readonly ExerciseSkillWeight[]) {
  if (skills.length === 0) {
    throw new Error("An exercise must score at least one skill.");
  }

  const totalWeight = skills.reduce((total, item) => total + item.weight, 0);

  if (!Number.isFinite(totalWeight) || totalWeight <= 0) {
    throw new RangeError("Exercise skill weights must add up to a positive value.");
  }

  for (const item of skills) {
    if (!Number.isFinite(item.weight) || item.weight <= 0) {
      throw new RangeError(`Weight for ${item.skill} must be greater than zero.`);
    }
  }
}

function getSkillScores(
  exercise: Exercise,
  rubric: DecisionRubric,
): readonly SkillScore[] {
  assertExerciseSkills(exercise.skills);

  return exercise.skills.map(({ skill, weight }) => {
    const score = rubric.skillScores[skill];

    if (score === undefined) {
      throw new Error(
        `Missing rubric score for skill ${skill} in exercise ${exercise.id}.`,
      );
    }

    assertScore(score, `Score for ${skill}`);

    return {
      skill,
      score,
      weight,
    };
  });
}

function calculateWeightedScore(skillScores: readonly SkillScore[]) {
  const totalWeight = skillScores.reduce((total, item) => total + item.weight, 0);
  const weightedTotal = skillScores.reduce(
    (total, item) => total + item.score * item.weight,
    0,
  );

  const normalizedScore = Number(
    (weightedTotal / totalWeight).toFixed(10),
  );

  return Math.round(normalizedScore);
}

function getDecisionScore(exercise: Exercise, decision: TrainingDecision) {
  return calculateWeightedScore(
    getSkillScores(exercise, exercise.rubric.decisions[decision]),
  );
}

function getRating(score: number): AttemptRating {
  if (score >= 85) {
    return "strong";
  }

  if (score >= 60) {
    return "acceptable";
  }

  return "weak";
}

function assertConfidence(confidence: number) {
  if (!Number.isFinite(confidence) || confidence < 50 || confidence > 100) {
    throw new RangeError("Confidence must be between 50 and 100.");
  }
}

export function scoreExerciseAttempt(
  exercise: Exercise,
  attempt: ExerciseAttemptInput,
): ExerciseAttemptResult {
  assertConfidence(attempt.confidence);

  const decisionRubric = exercise.rubric.decisions[attempt.decision];
  const skillScores = getSkillScores(exercise, decisionRubric);
  const overallScore = calculateWeightedScore(skillScores);
  const topScore = Math.max(
    getDecisionScore(exercise, "long"),
    getDecisionScore(exercise, "no_trade"),
    getDecisionScore(exercise, "short"),
  );

  return {
    exerciseId: exercise.id,
    exerciseVersion: exercise.version,
    rubricVersion: exercise.rubric.version,
    decision: attempt.decision,
    confidence: attempt.confidence,
    overallScore,
    rating: getRating(overallScore),
    isTopRatedDecision: overallScore === topScore,
    skillScores,
    summary: decisionRubric.summary,
    reasons: decisionRubric.reasons,
  };
}
