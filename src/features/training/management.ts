import type {
  Candle,
  DirectionalDecision,
  Exercise,
  ManagementActionInput,
  ManagementActionScore,
  ManagementCandleEvaluation,
  ManagementPositionState,
  ManagementSessionScore,
  PriceZone,
  PriceZoneRubric,
  TradePlan,
} from "./types";

const SCORE_PRECISION = 10;

function normalizeNumber(value: number) {
  return Number(value.toFixed(SCORE_PRECISION));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function assertScore(score: number, label: string) {
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new RangeError(`${label} must be between 0 and 100.`);
  }
}

function assertPlacementWeight(weight: number) {
  if (!Number.isFinite(weight) || weight < 0 || weight > 1) {
    throw new RangeError("Management placement weight must be between 0 and 1.");
  }
}

function assertZone(zone: PriceZone, label: string) {
  if (!Number.isFinite(zone.min) || !Number.isFinite(zone.max)) {
    throw new RangeError(`${label} must use finite values.`);
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

function distanceToZone(value: number, zone: PriceZone) {
  if (value < zone.min) {
    return zone.min - value;
  }

  if (value > zone.max) {
    return value - zone.max;
  }

  return 0;
}

function scoreZone(value: number, rubric: PriceZoneRubric) {
  if (!Number.isFinite(value)) {
    throw new RangeError("Management zone value must be finite.");
  }

  assertZoneRubric(rubric, "Management protected risk");

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

function assertCheckpointOffset(exercise: Exercise, offset: number) {
  if (!Number.isInteger(offset) || offset < 1 || offset > exercise.revealCount) {
    throw new RangeError(
      `Management checkpoint offset must be between 1 and ${exercise.revealCount}.`,
    );
  }
}

export function getManagementCheckpoints(
  exercise: Exercise,
  decision: DirectionalDecision,
) {
  const checkpoints = [...exercise.managementRubrics[decision].checkpoints].sort(
    (a, b) => a.afterRevealOffset - b.afterRevealOffset,
  );

  let previousOffset = 0;

  for (const checkpoint of checkpoints) {
    assertCheckpointOffset(exercise, checkpoint.afterRevealOffset);

    if (checkpoint.afterRevealOffset <= previousOffset) {
      throw new Error("Management checkpoints must use unique ascending offsets.");
    }

    assertScore(checkpoint.actions.hold.score, "Hold score");
    assertScore(checkpoint.actions.close.score, "Close score");
    assertScore(checkpoint.actions.move_stop.baseScore, "Move stop base score");
    assertPlacementWeight(checkpoint.actions.move_stop.placementWeight);
    assertZoneRubric(
      checkpoint.actions.move_stop.protectedRisk,
      "Move stop protected risk",
    );

    previousOffset = checkpoint.afterRevealOffset;
  }

  return checkpoints;
}

export function getManagementCandle(exercise: Exercise, revealOffset: number) {
  assertCheckpointOffset(exercise, revealOffset);

  const candle = exercise.candles[exercise.decisionIndex + revealOffset];

  if (!candle) {
    throw new RangeError("Management candle is outside the exercise dataset.");
  }

  return candle;
}

export function createManagementPosition(plan: TradePlan): ManagementPositionState {
  if (![plan.entry, plan.stop, plan.target].every(Number.isFinite)) {
    throw new RangeError("Trade plan prices must be finite.");
  }

  const initialRisk = Math.abs(plan.entry - plan.stop);

  if (initialRisk <= 0) {
    throw new RangeError("Trade plan must have positive initial risk.");
  }

  return {
    entry: plan.entry,
    target: plan.target,
    initialStop: plan.stop,
    activeStop: plan.stop,
  };
}

export function evaluateManagementCandle(
  decision: DirectionalDecision,
  position: ManagementPositionState,
  candle: Candle,
): ManagementCandleEvaluation {
  const stopHit =
    decision === "long"
      ? candle.low <= position.activeStop
      : candle.high >= position.activeStop;
  const targetHit =
    decision === "long"
      ? candle.high >= position.target
      : candle.low <= position.target;

  if (stopHit && targetHit) {
    return {
      status: "ambiguous",
      exitPrice: null,
    };
  }

  if (stopHit) {
    return {
      status: "stop_hit",
      exitPrice: position.activeStop,
    };
  }

  if (targetHit) {
    return {
      status: "target_hit",
      exitPrice: position.target,
    };
  }

  return {
    status: "open",
    exitPrice: null,
  };
}

export function calculateProtectedRiskR(
  decision: DirectionalDecision,
  position: ManagementPositionState,
  nextStop: number,
) {
  if (!Number.isFinite(nextStop)) {
    throw new RangeError("Managed stop must be finite.");
  }

  const initialRisk = Math.abs(position.entry - position.initialStop);

  if (initialRisk <= 0) {
    throw new RangeError("Management position must have positive initial risk.");
  }

  const protectedDistance =
    decision === "long"
      ? nextStop - position.initialStop
      : position.initialStop - nextStop;

  return normalizeNumber(protectedDistance / initialRisk);
}

export function isManagedStopValid(
  decision: DirectionalDecision,
  position: ManagementPositionState,
  nextStop: number,
  currentPrice: number,
) {
  if (!Number.isFinite(nextStop) || !Number.isFinite(currentPrice)) {
    return false;
  }

  if (decision === "long") {
    return (
      nextStop > position.activeStop &&
      nextStop < currentPrice &&
      nextStop < position.target
    );
  }

  return (
    nextStop < position.activeStop &&
    nextStop > currentPrice &&
    nextStop > position.target
  );
}

export function applyManagedStop(
  decision: DirectionalDecision,
  position: ManagementPositionState,
  nextStop: number,
  currentPrice: number,
): ManagementPositionState {
  if (!isManagedStopValid(decision, position, nextStop, currentPrice)) {
    throw new RangeError(
      "Managed stop must tighten risk without crossing the current market price or target.",
    );
  }

  return {
    ...position,
    activeStop: normalizeNumber(nextStop),
  };
}

export function scoreManagementAction(
  exercise: Exercise,
  decision: DirectionalDecision,
  position: ManagementPositionState,
  checkpointOffset: number,
  action: ManagementActionInput,
): ManagementActionScore {
  const checkpoint = getManagementCheckpoints(exercise, decision).find(
    (item) => item.afterRevealOffset === checkpointOffset,
  );

  if (!checkpoint) {
    throw new Error(
      `Exercise ${exercise.id} has no management checkpoint at offset ${checkpointOffset}.`,
    );
  }

  if (action.action === "hold" || action.action === "close") {
    const rubric = checkpoint.actions[action.action];

    return {
      checkpointOffset,
      action: action.action,
      score: rubric.score,
      summary: rubric.summary,
      reasons: rubric.reasons,
      protectedRiskR: null,
      placementScore: null,
    };
  }

  const currentCandle = getManagementCandle(exercise, checkpointOffset);

  if (!isManagedStopValid(decision, position, action.stop, currentCandle.close)) {
    throw new RangeError(
      "Moved stop must reduce risk and remain beyond the current closing price.",
    );
  }

  const rubric = checkpoint.actions.move_stop;
  const protectedRiskR = calculateProtectedRiskR(
    decision,
    position,
    action.stop,
  );
  const placementScore = scoreZone(protectedRiskR, rubric.protectedRisk);
  const score = Math.round(
    normalizeNumber(
      rubric.baseScore * (1 - rubric.placementWeight) +
        placementScore * rubric.placementWeight,
    ),
  );

  return {
    checkpointOffset,
    action: "move_stop",
    score: clamp(score, 0, 100),
    summary: rubric.summary,
    reasons: rubric.reasons,
    protectedRiskR,
    placementScore,
  };
}

export function scoreManagementSession(
  actions: readonly ManagementActionScore[],
): ManagementSessionScore {
  if (actions.length === 0) {
    throw new Error("Management session requires at least one scored action.");
  }

  const overallScore = Math.round(
    normalizeNumber(
      actions.reduce((total, action) => total + action.score, 0) /
        actions.length,
    ),
  );

  return {
    overallScore,
    actions,
  };
}
