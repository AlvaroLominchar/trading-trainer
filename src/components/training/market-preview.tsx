type Candle = {
  x: number;
  open: number;
  close: number;
  high: number;
  low: number;
};

const candles: readonly Candle[] = [
  { x: 28, open: 126, close: 116, high: 108, low: 137 },
  { x: 52, open: 116, close: 121, high: 110, low: 130 },
  { x: 76, open: 122, close: 105, high: 98, low: 128 },
  { x: 100, open: 105, close: 96, high: 88, low: 111 },
  { x: 124, open: 96, close: 102, high: 91, low: 113 },
  { x: 148, open: 102, close: 88, high: 81, low: 107 },
  { x: 172, open: 88, close: 82, high: 74, low: 95 },
  { x: 196, open: 82, close: 94, high: 77, low: 101 },
  { x: 220, open: 94, close: 87, high: 80, low: 99 },
  { x: 244, open: 87, close: 73, high: 66, low: 91 },
  { x: 268, open: 73, close: 78, high: 68, low: 87 },
  { x: 292, open: 78, close: 92, high: 75, low: 100 },
  { x: 316, open: 92, close: 98, high: 87, low: 105 },
  { x: 340, open: 98, close: 91, high: 83, low: 103 },
  { x: 364, open: 91, close: 101, high: 86, low: 111 },
  { x: 388, open: 101, close: 108, high: 96, low: 116 },
  { x: 412, open: 108, close: 104, high: 97, low: 114 },
  { x: 436, open: 104, close: 117, high: 99, low: 124 },
  { x: 460, open: 117, close: 111, high: 103, low: 126 },
  { x: 484, open: 111, close: 119, high: 107, low: 130 },
  { x: 508, open: 119, close: 113, high: 105, low: 123 },
  { x: 532, open: 113, close: 124, high: 109, low: 133 },
  { x: 556, open: 124, close: 121, high: 114, low: 130 },
  { x: 580, open: 121, close: 129, high: 116, low: 140 },
  { x: 604, open: 129, close: 123, high: 117, low: 136 },
];

export function MarketPreview() {
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
        <span className="size-1.5 rounded-full bg-app-accent" />
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-app-text-muted">
          Escenario oculto · 15m
        </span>
      </div>

      <div className="absolute right-4 top-4 z-10 rounded-lg border border-app-border bg-app-page-soft/90 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-app-text-muted backdrop-blur">
        Datos sintéticos
      </div>

      <svg
        aria-label="Previsualización de un gráfico de velas sintético"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        role="img"
        viewBox="0 0 640 220"
      >
        <defs>
          <linearGradient id="trainingFade" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="var(--theme-page)" stopOpacity="0" />
            <stop offset="100%" stopColor="var(--theme-page)" stopOpacity="0.94" />
          </linearGradient>
        </defs>

        {candles.map((candle) => {
          const isUp = candle.close < candle.open;
          const bodyY = Math.min(candle.open, candle.close);
          const bodyHeight = Math.max(Math.abs(candle.open - candle.close), 2);

          return (
            <g key={candle.x}>
              <line
                stroke={isUp ? "var(--theme-accent)" : "var(--theme-text-muted)"}
                strokeOpacity={isUp ? 0.9 : 0.7}
                strokeWidth="1.25"
                vectorEffect="non-scaling-stroke"
                x1={candle.x}
                x2={candle.x}
                y1={candle.high}
                y2={candle.low}
              />
              <rect
                fill={isUp ? "var(--theme-accent)" : "var(--theme-text-muted)"}
                fillOpacity={isUp ? 0.9 : 0.72}
                height={bodyHeight}
                rx="1"
                width="10"
                x={candle.x - 5}
                y={bodyY}
              />
            </g>
          );
        })}

        <rect fill="url(#trainingFade)" height="220" width="100" x="540" y="0" />
        <line
          stroke="var(--theme-accent)"
          strokeDasharray="4 5"
          strokeOpacity="0.45"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          x1="544"
          x2="544"
          y1="34"
          y2="198"
        />
      </svg>

      <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between gap-3">
        <span className="rounded-lg border border-app-border bg-app-page-soft/90 px-3 py-2 text-[10px] text-app-text-muted backdrop-blur">
          El futuro queda oculto a partir de la línea
        </span>
        <span className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-app-text-muted sm:block">
          Preview V1
        </span>
      </div>
    </div>
  );
}
