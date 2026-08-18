import type { Candle, ExerciseTimeframe } from "@/features/training/types";

type MarketPreviewProps = {
  candles: readonly Candle[];
  decisionIndex: number;
  revealCount: number;
  revealFuture: boolean;
  isRevealing: boolean;
  sourceLabel: string;
  timeframe: ExerciseTimeframe;
};

const VIEWBOX_WIDTH = 960;
const VIEWBOX_HEIGHT = 360;
const CHART_LEFT = 34;
const CHART_RIGHT = 926;
const CHART_TOP = 46;
const CHART_BOTTOM = 316;
const BODY_WIDTH = 7;

function clampRevealEnd(
  candleCount: number,
  decisionIndex: number,
  revealCount: number,
) {
  return Math.min(candleCount - 1, decisionIndex + revealCount);
}

export function MarketPreview({
  candles,
  decisionIndex,
  revealCount,
  revealFuture,
  isRevealing,
  sourceLabel,
  timeframe,
}: MarketPreviewProps) {
  const revealEnd = clampRevealEnd(candles.length, decisionIndex, revealCount);
  const totalDisplayCount = revealEnd + 1;
  const renderedEnd = revealFuture ? revealEnd : decisionIndex;
  const renderedCandles = candles.slice(0, renderedEnd + 1);

  const minPrice = Math.min(...renderedCandles.map((candle) => candle.low));
  const maxPrice = Math.max(...renderedCandles.map((candle) => candle.high));
  const priceRange = Math.max(maxPrice - minPrice, 1);
  const paddedMin = minPrice - priceRange * 0.08;
  const paddedMax = maxPrice + priceRange * 0.08;
  const paddedRange = paddedMax - paddedMin;

  const xStep = (CHART_RIGHT - CHART_LEFT) / Math.max(totalDisplayCount - 1, 1);
  const xForIndex = (index: number) => CHART_LEFT + index * xStep;
  const yForPrice = (price: number) =>
    CHART_TOP +
    ((paddedMax - price) / paddedRange) * (CHART_BOTTOM - CHART_TOP);

  const decisionLineX = Math.min(
    CHART_RIGHT,
    xForIndex(decisionIndex) + xStep * 0.55,
  );
  const hiddenWidth = Math.max(CHART_RIGHT - decisionLineX, 0);

  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-2xl border border-app-border bg-app-page sm:min-h-[430px]">
      <div className="absolute inset-0 opacity-60">
        <div className="grid h-full grid-rows-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              className="border-b border-app-border last:border-b-0"
              key={index}
            />
          ))}
        </div>
      </div>

      <div className="absolute inset-0 opacity-40">
        <div className="grid h-full grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              className="border-r border-app-border last:border-r-0"
              key={index}
            />
          ))}
        </div>
      </div>

      <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-lg border border-app-border bg-app-page-soft/90 px-3 py-2 backdrop-blur">
        <span
          className={`size-1.5 rounded-full bg-app-accent ${
            isRevealing ? "animate-pulse" : ""
          }`}
        />
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-app-text-muted">
          {revealFuture ? "Futuro revelado" : `Escenario oculto · ${timeframe}`}
        </span>
      </div>

      <div className="absolute right-4 top-4 z-10 rounded-lg border border-app-border bg-app-page-soft/90 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-app-text-muted backdrop-blur">
        {sourceLabel}
      </div>

      <svg
        aria-label={
          revealFuture
            ? "Gráfico de velas sintético con el tramo posterior revelado"
            : "Gráfico de velas sintético con el futuro oculto"
        }
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
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
          const bodyHeight = Math.max(Math.abs(closeY - openY), 2.5);
          const isFutureCandle = index > decisionIndex;

          return (
            <g
              key={`${candle.timestamp}-${index}`}
              opacity={isFutureCandle && isRevealing ? 0.86 : 1}
            >
              <line
                stroke={isUp ? "var(--theme-accent)" : "var(--theme-text-muted)"}
                strokeOpacity={isUp ? 0.92 : 0.72}
                strokeWidth="1.25"
                vectorEffect="non-scaling-stroke"
                x1={x}
                x2={x}
                y1={highY}
                y2={lowY}
              />
              <rect
                fill={isUp ? "var(--theme-accent)" : "var(--theme-text-muted)"}
                fillOpacity={isUp ? 0.9 : 0.72}
                height={bodyHeight}
                rx="1"
                width={BODY_WIDTH}
                x={x - BODY_WIDTH / 2}
                y={bodyY}
              />
            </g>
          );
        })}

        {!revealFuture && hiddenWidth > 0 ? (
          <rect
            fill="url(#trainingHiddenFade)"
            height={CHART_BOTTOM - CHART_TOP + 22}
            width={hiddenWidth}
            x={decisionLineX}
            y={CHART_TOP - 11}
          />
        ) : null}

        <line
          stroke="var(--theme-accent)"
          strokeDasharray="4 5"
          strokeOpacity={revealFuture ? 0.28 : 0.52}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          x1={decisionLineX}
          x2={decisionLineX}
          y1={CHART_TOP - 8}
          y2={CHART_BOTTOM + 8}
        />
      </svg>

      <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between gap-3">
        <span className="rounded-lg border border-app-border bg-app-page-soft/90 px-3 py-2 text-[10px] text-app-text-muted backdrop-blur">
          {revealFuture
            ? "La línea marca dónde tomaste la decisión"
            : "El futuro queda oculto a partir de la línea"}
        </span>
        <span className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-app-text-muted sm:block">
          {revealFuture ? `${revealCount} velas reveladas` : "Decide sin conocer el final"}
        </span>
      </div>
    </div>
  );
}
