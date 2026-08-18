import type {
  DirectionalDecision,
  Exercise,
  PriceZone,
  PriceZoneRubric,
  TradePlan,
  TradePlanComponentScore,
  TradePlanResult,
  TradePlanRubric,
} from "./types";

const SCORE_PRECISION = 10;

function normalizeNumber(value: number) {
  return Number(value.toFixed(SCORE_PRECISION));
}

function assertFinitePositive(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be greater than zero.`);
  }
}

function assertZone(zone: PriceZone, label: string) {
  if (!Number.isFinite(zone.min) || !Number.isFinite(zone.max)) {
    throw new RangeError(`${label} must use finite prices.`);
  }

  if (zone.min > zone.max) {
    throw new RangeError(`${label} min must be less than or equal to max.`);
  }
}

function assertZoneRubric(rubric: PriceZoneRubric, label: string) {
  assertZone(rubric.optimal, `${label} optimal zone`);
  assertZone(rubric.acceptable, `${label} acceptable zone`);

  if (
    rubric.acceptable.min > rubric.optimal.min ||
    rubric.acceptable.max < rubric.optimal.max
  ) {
    throw new RangeError(`${label} acceptable zone must contain the optimal zone.`);
  }
}

function assertTradePlanRubric(rubric: TradePlanRubric) {
  assertZoneRubric(rubric.entry, "Entry");
  assertZoneRubric(rubric.stop, "Stop");
  assertZoneRubric(rubric.target, "Target");
  assertFinitePositive(rubric.minimumRewardRisk, "Minimum reward/risk");
  assertFinitePositive(rubric.idealRewardRisk, "Ideal reward/risk");

  if (rubric.idealRewardRisk < rubric.minimumRewardRisk) {
    throw new RangeError(
      "Ideal reward/risk must be greater than or equal to minimum reward/risk.",
    );
  }

  const weights = Object.values(rubric.weights);

  for (const weight of weights) {
    assertFinitePositive(weight, "Trade plan weight");
  }
}

export function isTradePlanGeometryValid(
  decision: DirectionalDecision,
  plan: TradePlan,
) {
  if (![plan.entry, plan.stop, plan.target].every(Number.isFinite)) {
    return false;
  }

  if (decision === "long") {
    return plan.stop < plan.entry && plan.entry < plan.target;
  }

  return plan.target < plan.entry && plan.entry < plan.stop;
}

export function calculateRewardRisk(
  decision: DirectionalDecision,
  plan: TradePlan,
) {
  if (!isTradePlanGeometryValid(decision, plan)) {
    throw new RangeError(
      `Invalid ${decision} trade plan geometry. Stop, entry and target are not ordered correctly.`,
    );
  }

  const risk = Math.abs(plan.entry - plan.stop);
  const reward = Math.abs(plan.target - plan.entry);

  return normalizeNumber(reward / risk);
}

function distanceToZone(value: number, zone: PriceZone) {
  if (value < zone.min) {
    return zone.min - value;
  }

  if (value > zone.max) {
    return value - zone.max;
  }

  return 0;
}

export function scorePriceZone(value: number, rubric: PriceZoneRubric) {
  if (!Number.isFinite(value)) {
    throw new RangeError("Price must be finite.");
  }

  assertZoneRubric(rubric, "Price");

  if (distanceToZone(value, rubric.optimal) === 0) {
    return 100;
  }

  const acceptableDistance = distanceToZone(value, rubric.acceptable);

  if (acceptableDistance === 0) {
    const buffer =
      value < rubric.optimal.min
        ? rubric.optimal.min - rubric.acceptable.min
        : rubric.acceptable.max - rubric.optimal.max;
    const distance = distanceToZone(value, rubric.optimal);

    if (buffer <= 0) {
      return 100;
    }

    return Math.round(100 - (distance / buffer) * 40);
  }

  const outsideBuffer =
    value < rubric.acceptable.min
      ? Math.max(rubric.optimal.min - rubric.acceptable.min, 0.000001)
      : Math.max(rubric.acceptable.max - rubric.optimal.max, 0.000001);

  return Math.max(
    0,
    Math.round(60 - (acceptableDistance / outsideBuffer) * 60),
  );
}

export function scoreRewardRisk(
  rewardRisk: number,
  minimumRewardRisk: number,
  idealRewardRisk: number,
) {
  if (!Number.isFinite(rewardRisk) || rewardRisk < 0) {
    throw new RangeError("Reward/risk must be a non-negative finite value.");
  }

  assertFinitePositive(minimumRewardRisk, "Minimum reward/risk");
  assertFinitePositive(idealRewardRisk, "Ideal reward/risk");

  if (idealRewardRisk < minimumRewardRisk) {
    throw new RangeError(
      "Ideal reward/risk must be greater than or equal to minimum reward/risk.",
    );
  }

  if (rewardRisk >= idealRewardRisk) {
    return 100;
  }

  if (rewardRisk >= minimumRewardRisk) {
    if (idealRewardRisk === minimumRewardRisk) {
      return 100;
    }

    const progress =
      (rewardRisk - minimumRewardRisk) /
      (idealRewardRisk - minimumRewardRisk);

    return Math.round(60 + progress * 40);
  }

  return Math.max(0, Math.round((rewardRisk / minimumRewardRisk) * 60));
}

function calculateWeightedScore(
  componentScores: readonly TradePlanComponentScore[],
) {
  const totalWeight = componentScores.reduce(
    (total, component) => total + component.weight,
    0,
  );
  const weightedTotal = componentScores.reduce(
    (total, component) => total + component.score * component.weight,
    0,
  );

  return Math.round(normalizeNumber(weightedTotal / totalWeight));
}

export function scoreTradePlan(
  exercise: Exercise,
  decision: DirectionalDecision,
  plan: TradePlan,
): TradePlanResult {
  const rubric = exercise.tradePlanRubrics[decision];

  assertTradePlanRubric(rubric);

  const rewardRisk = calculateRewardRisk(decision, plan);
  const componentScores: readonly TradePlanComponentScore[] = [
    {
      component: "entry",
      score: scorePriceZone(plan.entry, rubric.entry),
      weight: rubric.weights.entry,
    },
    {
      component: "invalidation",
      score: scorePriceZone(plan.stop, rubric.stop),
      weight: rubric.weights.invalidation,
    },
    {
      component: "target",
      score: scorePriceZone(plan.target, rubric.target),
      weight: rubric.weights.target,
    },
    {
      component: "reward_risk",
      score: scoreRewardRisk(
        rewardRisk,
        rubric.minimumRewardRisk,
        rubric.idealRewardRisk,
      ),
      weight: rubric.weights.rewardRisk,
    },
  ];

  return {
    decision,
    plan,
    rewardRisk,
    overallScore: calculateWeightedScore(componentScores),
    componentScores,
  };
}
