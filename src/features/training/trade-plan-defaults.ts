import type {
  DirectionalDecision,
  Exercise,
  TradePlan,
} from "./types";

const RECENT_CANDLE_WINDOW = 12;
const RISK_RANGE_MULTIPLIER = 2;
const MAX_VISIBLE_RANGE_SHARE = 0.35;
const DEFAULT_REWARD_RISK = 1.25;
const PRICE_PRECISION = 4;

function roundPrice(value: number) {
  return Number(value.toFixed(PRICE_PRECISION));
}

export function createNeutralTradePlan(
  exercise: Exercise,
  decision: DirectionalDecision,
): TradePlan {
  const visibleCandles = exercise.candles.slice(0, exercise.decisionIndex + 1);

  if (visibleCandles.length === 0) {
    throw new Error(`Exercise ${exercise.id} has no visible candles.`);
  }

  const recentCandles = visibleCandles.slice(-RECENT_CANDLE_WINDOW);
  const averageRange =
    recentCandles.reduce(
      (total, candle) => total + (candle.high - candle.low),
      0,
    ) / recentCandles.length;
  const visibleMin = Math.min(...visibleCandles.map((candle) => candle.low));
  const visibleMax = Math.max(...visibleCandles.map((candle) => candle.high));
  const visibleRange = Math.max(visibleMax - visibleMin, 0.0001);
  const lastPrice = visibleCandles[visibleCandles.length - 1].close;
  const volatilityRisk = Math.max(averageRange * RISK_RANGE_MULTIPLIER, 0.0001);
  const risk = Math.min(
    volatilityRisk,
    Math.max(visibleRange * MAX_VISIBLE_RANGE_SHARE, 0.0001),
  );
  const reward = risk * DEFAULT_REWARD_RISK;

  if (decision === "long") {
    return {
      entry: roundPrice(lastPrice),
      stop: roundPrice(lastPrice - risk),
      target: roundPrice(lastPrice + reward),
    };
  }

  return {
    entry: roundPrice(lastPrice),
    stop: roundPrice(lastPrice + risk),
    target: roundPrice(lastPrice - reward),
  };
}
