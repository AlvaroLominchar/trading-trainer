"use client";

import type { PointerEvent as ReactPointerEvent } from "react";

import type {
  Candle,
  DirectionalDecision,
  ExerciseTimeframe,
  TradePlan,
} from "@/features/training/types";

type TradePlanLine = "entry" | "stop" | "target";

type MarketPreviewProps = {
  candles: readonly Candle[];
  compact?: boolean;
  decisionIndex: number;
  revealCount: number;
  revealedCount: number;
  isRevealing: boolean;
  sourceLabel: string;
  timeframe: ExerciseTimeframe;
  tradePlan?: TradePlan | null;
  tradePlanDecision?: DirectionalDecision | null;
  tradePlanDisabled?: boolean;
  editableTradePlanLines?: readonly TradePlanLine[];
  onTradePlanChange?: (plan: TradePlan) => void;
};

const VIEWBOX_WIDTH = 960;
const VIEWBOX_HEIGHT = 360;
const CHART_LEFT = 34;
const CHART_RIGHT = 926;
const CHART_TOP = 46;
const CHART_BOTTOM = 316;
const BODY_WIDTH = 9;
const PRICE_PADDING_SHARE = 0.22;
const MIN_LINE_GAP_SHARE = 0.012;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clampRevealCount(revealCount: number, revealedCount: number) {
  return clamp(Math.floor(revealedCount), 0, revealCount);
}

function clampRevealEnd(
  candleCount: number,
  decisionIndex: number,
  revealCount: number,
) {
  return Math.min(candleCount - 1, decisionIndex + revealCount);
}

function formatPrice(value: number) {
  return value.toFixed(2);
}

function formatTimeframeLabel(timeframe: ExerciseTimeframe) {
  if (timeframe.endsWith("m")) {
    return `${timeframe.slice(0, -1)} min`;
  }

  if (timeframe.endsWith("h")) {
    return `${timeframe.slice(0, -1)} h`;
  }

  return timeframe;
}

function constrainPlanLine(
  line: TradePlanLine,
  rawPrice: number,
  decision: DirectionalDecision,
  plan: TradePlan,
  minPrice: number,
  maxPrice: number,
): TradePlan {
  const minGap = Math.max((maxPrice - minPrice) * MIN_LINE_GAP_SHARE, 0.0001);
  const next = { ...plan };

  if (decision === "long") {
    if (line === "entry") {
      next.entry = clamp(rawPrice, plan.stop + minGap, plan.target - minGap);
    } else if (line === "stop") {
      next.stop = clamp(rawPrice, minPrice, plan.entry - minGap);
    } else {
      next.target = clamp(rawPrice, plan.entry + minGap, maxPrice);
    }
  } else if (line === "entry") {
    next.entry = clamp(rawPrice, plan.target + minGap, plan.stop - minGap);
  } else if (line === "stop") {
    next.stop = clamp(rawPrice, plan.entry + minGap, maxPrice);
  } else {
    next.target = clamp(rawPrice, minPrice, plan.entry - minGap);
  }

  return {
    entry: Number(next.entry.toFixed(4)),
    stop: Number(next.stop.toFixed(4)),
    target: Number(next.target.toFixed(4)),
  };
}

export function MarketPreview({
  candles,
  compact = false,
  decisionIndex,
  revealCount,
  revealedCount,
  isRevealing,
  sourceLabel,
  timeframe,
  tradePlan = null,
  tradePlanDecision = null,
  tradePlanDisabled = false,
  editableTradePlanLines = ["entry", "stop", "target"],
  onTradePlanChange,
}: MarketPreviewProps) {
  const safeRevealedCount = clampRevealCount(revealCount, revealedCount);
  const revealEnd = clampRevealEnd(candles.length, decisionIndex, revealCount);
  const totalDisplayCount = revealEnd + 1;
  const renderedEnd = Math.min(
    revealEnd,
    decisionIndex + safeRevealedCount,
  );
  const renderedCandles = candles.slice(0, renderedEnd + 1);
  const isFullyRevealed = safeRevealedCount >= revealCount;
  const isPartiallyRevealed = safeRevealedCount > 0 && !isFullyRevealed;

  const minCandlePrice = Math.min(...renderedCandles.map((candle) => candle.low));
  const maxCandlePrice = Math.max(...renderedCandles.map((candle) => candle.high));
  const candleRange = Math.max(maxCandlePrice - minCandlePrice, 1);
  const paddedMin = minCandlePrice - candleRange * PRICE_PADDING_SHARE;
  const paddedMax = maxCandlePrice + candleRange * PRICE_PADDING_SHARE;
  const paddedRange = paddedMax - paddedMin;

  const xStep = (CHART_RIGHT - CHART_LEFT) / Math.max(totalDisplayCount - 1, 1);
  const xForIndex = (index: number) => CHART_LEFT + index * xStep;
  const yForPrice = (price: number) =>
    CHART_TOP +
    ((paddedMax - price) / paddedRange) * (CHART_BOTTOM - CHART_TOP);
  const priceForClientY = (clientY: number, svg: SVGSVGElement) => {
    const rect = svg.getBoundingClientRect();
    const viewBoxY = ((clientY - rect.top) / Math.max(rect.height, 1)) * VIEWBOX_HEIGHT;
    const chartProgress = clamp(
      (viewBoxY - CHART_TOP) / (CHART_BOTTOM - CHART_TOP),
      0,
      1,
    );

    return paddedMax - chartProgress * paddedRange;
  };

  const decisionLineX = Math.min(
    CHART_RIGHT,
    xForIndex(decisionIndex) + xStep * 0.55,
  );
  const hiddenStartX = Math.min(
    CHART_RIGHT,
    xForIndex(renderedEnd) + xStep * 0.55,
  );
  const hiddenWidth = Math.max(CHART_RIGHT - hiddenStartX, 0);
  const canEditTradePlan = Boolean(
    tradePlan && tradePlanDecision && onTradePlanChange && !tradePlanDisabled,
  );

  function handlePlanPointerMove(
    event: ReactPointerEvent<SVGLineElement>,
    line: TradePlanLine,
  ) {
    if (
      !canEditTradePlan ||
      !editableTradePlanLines.includes(line) ||
      !tradePlan ||
      !tradePlanDecision ||
      !onTradePlanChange ||
      !event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      return;
    }

    const svg = event.currentTarget.ownerSVGElement;

    if (!svg) {
      return;
    }

    const rawPrice = priceForClientY(event.clientY, svg);
    onTradePlanChange(
      constrainPlanLine(
        line,
        rawPrice,
        tradePlanDecision,
        tradePlan,
        paddedMin,
        paddedMax,
      ),
    );
  }

  const planLines: readonly {
    line: TradePlanLine;
    label: string;
    value: number;
    stroke: string;
    dash?: string;
  }[] = tradePlan
    ? [
        {
          line: "target",
          label: "TARGET",
          value: tradePlan.target,
          stroke: "var(--theme-trading-bull)",
          dash: "6 5",
        },
        {
          line: "entry",
          label: "ENTRY",
          value: tradePlan.entry,
          stroke: "var(--theme-text)",
        },
        {
          line: "stop",
          label: "STOP",
          value: tradePlan.stop,
          stroke: "var(--theme-trading-bear)",
          dash: "3 4",
        },
      ]
    : [];

  const topStatus = isFullyRevealed
    ? "Futuro revelado"
    : isPartiallyRevealed
      ? `Gestión · ${safeRevealedCount}/${revealCount} velas`
      : `Escenario oculto · ${formatTimeframeLabel(timeframe)}`;

  return (
    <div
      className={`relative min-w-0 w-full max-w-full overflow-hidden rounded-2xl border border-app-border bg-app-page ${
        compact ? "h-full min-h-[320px] sm:min-h-[390px]" : "min-h-[360px] sm:min-h-[430px]"
      }`}
    >
      <div className="absolute inset-0 opacity-60">
        <div className="grid h-full grid-rows-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div className="border-b border-app-border last:border-b-0" key={index} />
          ))}
        </div>
      </div>

      <div className="absolute inset-0 opacity-40">
        <div className="grid h-full grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="border-r border-app-border last:border-r-0" key={index} />
          ))}
        </div>
      </div>

      <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-lg border border-app-border-strong bg-app-page-soft/95 px-3 py-2 backdrop-blur">
        <span
          className={`size-1.5 rounded-full bg-app-text-soft ${isRevealing ? "animate-pulse" : ""}`}
        />
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-app-text-soft">
          {topStatus}
        </span>
      </div>

      <div className="absolute right-4 top-4 z-10 rounded-lg border border-app-border-strong bg-app-page-soft/95 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-app-text-soft backdrop-blur">
        {sourceLabel}
      </div>

      <svg
        aria-label={
          isFullyRevealed
            ? "Gráfico de velas sintético con el tramo posterior revelado"
            : isPartiallyRevealed
              ? "Gráfico de velas sintético en gestión progresiva"
              : "Gráfico de velas sintético con el futuro oculto"
        }
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      >
        <defs>
          <linearGradient id="trainingHiddenFade" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="var(--theme-page)" stopOpacity="0.34" />
            <stop offset="100%" stopColor="var(--theme-page)" stopOpacity="0.96" />
          </linearGradient>
        </defs>

        {renderedCandles.map((candle, index) => {
          const x = xForIndex(index);
          const openY = yForPrice(candle.open);
          const closeY = yForPrice(candle.close);
          const highY = yForPrice(candle.high);
          const lowY = yForPrice(candle.low);
          const isUp = candle.close >= candle.open;
          const bodyY = Math.min(openY, closeY);
          const bodyHeight = Math.max(Math.abs(closeY - openY), 3.5);
          const isFutureCandle = index > decisionIndex;

          return (
            <g key={`${candle.timestamp}-${index}`} opacity={isFutureCandle && isRevealing ? 0.86 : 1}>
              <line
                stroke={isUp ? "var(--theme-trading-bull)" : "var(--theme-trading-bear)"}
                strokeOpacity={0.92}
                strokeWidth="1.55"
                vectorEffect="non-scaling-stroke"
                x1={x}
                x2={x}
                y1={highY}
                y2={lowY}
              />
              <rect
                fill={isUp ? "var(--theme-trading-bull)" : "var(--theme-trading-bear)"}
                fillOpacity={0.9}
                height={bodyHeight}
                rx="1"
                width={BODY_WIDTH}
                x={x - BODY_WIDTH / 2}
                y={bodyY}
              />
            </g>
          );
        })}

        {!isFullyRevealed && hiddenWidth > 0 ? (
          <rect
            fill="url(#trainingHiddenFade)"
            height={CHART_BOTTOM - CHART_TOP + 22}
            width={hiddenWidth}
            x={hiddenStartX}
            y={CHART_TOP - 11}
          />
        ) : null}

        <line
          stroke="var(--theme-border-strong)"
          strokeDasharray="4 5"
          strokeOpacity={isFullyRevealed ? 0.34 : 0.58}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          x1={decisionLineX}
          x2={decisionLineX}
          y1={CHART_TOP - 8}
          y2={CHART_BOTTOM + 8}
        />

        {planLines.map(({ line, label, value, stroke, dash }) => {
          const y = yForPrice(value);
          const labelY = clamp(y - 14.5, CHART_TOP - 2, CHART_BOTTOM - 27);
          const isEditable = canEditTradePlan && editableTradePlanLines.includes(line);

          return (
            <g key={line}>
              <line
                stroke={stroke}
                strokeDasharray={dash}
                strokeOpacity="0.92"
                strokeWidth="1.8"
                vectorEffect="non-scaling-stroke"
                x1={CHART_LEFT}
                x2={CHART_RIGHT}
                y1={y}
                y2={y}
              />
              {isEditable ? (
                <line
                  aria-label={`Mover ${label.toLowerCase()}`}
                  className="cursor-ns-resize"
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.currentTarget.setPointerCapture(event.pointerId);
                  }}
                  onPointerMove={(event) => handlePlanPointerMove(event, line)}
                  onPointerUp={(event) => {
                    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                      event.currentTarget.releasePointerCapture(event.pointerId);
                    }
                  }}
                  stroke="transparent"
                  strokeWidth="28"
                  style={{ touchAction: "none" }}
                  vectorEffect="non-scaling-stroke"
                  x1={CHART_LEFT}
                  x2={CHART_RIGHT}
                  y1={y}
                  y2={y}
                />
              ) : null}
              <g pointerEvents="none">
                <rect
                  fill="var(--theme-page)"
                  fillOpacity="0.94"
                  height="29"
                  rx="5"
                  stroke={stroke}
                  strokeOpacity="0.56"
                  width="148"
                  x={CHART_LEFT + 4}
                  y={labelY}
                />
                <text
                  fill={stroke}
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  fontSize="11.5"
                  x={CHART_LEFT + 12}
                  y={labelY + 18.6}
                >
                  {label} · {formatPrice(value)}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {tradePlan && tradePlanDecision && !isFullyRevealed ? (
        <div className="absolute left-4 top-[62px] z-10 rounded-lg border border-app-border-strong bg-app-page-soft/95 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-app-text-soft backdrop-blur">
          {tradePlanDisabled
            ? "Plan bloqueado"
            : editableTradePlanLines.length === 1 && editableTradePlanLines[0] === "stop"
              ? "Ajusta solo el stop"
              : "Arrastra las líneas · ratón o táctil"}
        </div>
      ) : null}

      <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between gap-3">
        <span className="rounded-lg border border-app-border-strong bg-app-page-soft/95 px-3 py-2 text-[10px] text-app-text-soft backdrop-blur">
          {isFullyRevealed
            ? "La línea vertical marca dónde tomaste la decisión"
            : isPartiallyRevealed
              ? "La operación avanza solo con la información ya revelada"
              : tradePlan
                ? "Ajusta tu plan antes de confirmar"
                : "El futuro queda oculto a partir de la línea"}
        </span>
        <span className="hidden rounded-lg border border-app-border-strong bg-app-page-soft/95 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-app-text-soft backdrop-blur sm:block">
          {isFullyRevealed
            ? `${revealCount} velas reveladas`
            : `${safeRevealedCount}/${revealCount} velas`}
        </span>
      </div>
    </div>
  );
}
