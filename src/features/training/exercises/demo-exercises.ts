import type { Candle, Exercise } from "../types";

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const SYNTHETIC_START = Date.UTC(2026, 0, 5, 8, 0, 0);

function buildCandles(
  closes: readonly number[],
  startTimestamp: number,
  baseVolume: number,
): readonly Candle[] {
  return closes.map((close, index) => {
    const previousClose = index === 0 ? close + 0.35 : closes[index - 1];
    const open = Number(previousClose.toFixed(2));
    const wick = 0.38 + ((index * 7) % 5) * 0.11;
    const high = Number((Math.max(open, close) + wick).toFixed(2));
    const low = Number((Math.min(open, close) - wick * 0.92).toFixed(2));

    return {
      timestamp: startTimestamp + index * FIFTEEN_MINUTES_MS,
      open,
      high,
      low,
      close: Number(close.toFixed(2)),
      volume: baseVolume + ((index * 37) % 260),
    };
  });
}

const downtrendCloses = [
  108.4, 107.9, 107.2, 106.7, 106.1, 105.5, 104.9, 105.2, 104.6, 104.0,
  103.5, 102.9, 102.2, 101.7, 101.1, 101.5, 100.9, 100.3, 99.8, 99.1,
  98.6, 98.0, 97.4, 97.8, 97.1, 96.5, 96.0, 95.4, 94.9, 94.3,
  93.8, 94.2, 94.7, 95.1, 94.8, 94.4, 94.0, 93.7, 93.4, 93.0,
  92.6, 92.2, 91.8, 91.5, 91.1, 90.8, 90.4, 90.0, 89.7, 89.3,
  89.0, 88.6, 88.2, 87.9, 87.5, 87.1, 86.8, 86.4, 86.1, 85.8,
  85.4, 85.0, 84.7, 84.3, 83.9, 83.6, 83.2, 82.9, 82.5, 82.2,
  81.8, 81.5,
] as const;

const rangeCloses = [
  100.0, 101.1, 102.0, 101.4, 100.6, 99.8, 99.1, 98.6, 99.3, 100.2,
  101.0, 101.8, 102.2, 101.5, 100.7, 99.9, 99.2, 98.8, 99.5, 100.3,
  101.2, 101.9, 101.4, 100.8, 100.1, 99.4, 98.9, 99.6, 100.4, 101.1,
  101.7, 101.2, 100.5, 99.8, 99.2, 98.7, 99.4, 100.1, 100.8, 101.5,
  101.9, 101.3, 100.6, 99.9, 99.3, 98.9, 99.5, 100.2, 100.9, 101.4,
  100.8, 100.2, 99.7, 99.3, 99.8, 100.4, 100.9, 100.5, 100.0, 99.6,
  100.1, 100.6, 101.0, 100.4, 99.9, 99.5, 100.0, 100.5, 100.8, 100.3,
  99.8, 100.2,
] as const;

const falseBreakoutCloses = [
  96.8, 97.2, 97.7, 98.1, 98.6, 99.0, 99.5, 99.9, 100.2, 100.0,
  99.7, 99.4, 99.8, 100.1, 100.4, 100.8, 101.0, 100.7, 100.3, 100.0,
  99.8, 100.1, 100.5, 100.9, 101.2, 101.0, 100.6, 100.3, 100.0, 100.4,
  100.8, 101.1, 101.4, 101.0, 100.7, 100.4, 100.8, 101.2, 101.5, 101.1,
  100.8, 101.0, 101.4, 101.8, 102.2, 102.7, 103.3, 103.9, 104.5, 104.9,
  104.3, 103.6, 102.9, 102.2, 101.7, 101.3, 101.0, 100.8, 101.1, 100.9,
  100.6, 100.3, 100.0, 99.7, 99.4, 99.1, 98.8, 98.5, 98.2, 97.9,
  97.6, 97.3,
] as const;

export const DEMO_EXERCISES: readonly Exercise[] = [
  {
    id: "trend-continuation-001",
    version: 1,
    title: "Continuación tras rebote débil",
    prompt:
      "Observa la estructura disponible y decide qué opción está mejor justificada antes de revelar el siguiente tramo.",
    timeframe: "15m",
    source: {
      kind: "synthetic",
      label: "Escenario sintético · tendencia",
    },
    candles: buildCandles(downtrendCloses, SYNTHETIC_START, 920),
    decisionIndex: 59,
    revealCount: 12,
    skills: [
      { skill: "trend_reading", weight: 0.6 },
      { skill: "context_reading", weight: 0.25 },
      { skill: "discipline", weight: 0.15 },
    ],
    tradePlanRubrics: {
      long: {
        entry: {
          optimal: { min: 85.7, max: 86.2 },
          acceptable: { min: 85.2, max: 86.7 },
        },
        stop: {
          optimal: { min: 84.6, max: 85.1 },
          acceptable: { min: 84.0, max: 85.4 },
        },
        target: {
          optimal: { min: 87.2, max: 88.2 },
          acceptable: { min: 86.8, max: 89.0 },
        },
        minimumRewardRisk: 1.2,
        idealRewardRisk: 2,
        weights: {
          entry: 0.25,
          invalidation: 0.35,
          target: 0.2,
          rewardRisk: 0.2,
        },
      },
      short: {
        entry: {
          optimal: { min: 85.6, max: 86.1 },
          acceptable: { min: 85.1, max: 86.6 },
        },
        stop: {
          optimal: { min: 86.8, max: 87.5 },
          acceptable: { min: 86.4, max: 88.2 },
        },
        target: {
          optimal: { min: 83.4, max: 84.4 },
          acceptable: { min: 82.5, max: 85.0 },
        },
        minimumRewardRisk: 1.4,
        idealRewardRisk: 2.2,
        weights: {
          entry: 0.25,
          invalidation: 0.35,
          target: 0.2,
          rewardRisk: 0.2,
        },
      },
    },
    rubric: {
      version: 1,
      decisions: {
        long: {
          skillScores: {
            trend_reading: 22,
            context_reading: 30,
            discipline: 42,
          },
          summary: "La decisión lucha contra una estructura bajista todavía intacta.",
          reasons: [
            "La secuencia visible mantiene máximos y mínimos descendentes.",
            "El rebote previo no invalida la estructura dominante.",
            "Sin una señal adicional, anticipar un giro exige más evidencia de la disponible.",
          ],
        },
        no_trade: {
          skillScores: {
            trend_reading: 68,
            context_reading: 72,
            discipline: 88,
          },
          summary: "Esperar es defendible, aunque la estructura sí ofrece una lectura direccional clara.",
          reasons: [
            "No operar evita forzar una entrada sin definir todavía riesgo ni invalidación.",
            "La lectura del contexto sigue siendo coherente con la tendencia visible.",
            "En esta versión del entrenamiento no se evalúan aún niveles de entrada o stop.",
          ],
        },
        short: {
          skillScores: {
            trend_reading: 92,
            context_reading: 88,
            discipline: 82,
          },
          summary: "Es la decisión mejor alineada con la estructura disponible en el punto de corte.",
          reasons: [
            "La tendencia visible conserva máximos y mínimos descendentes.",
            "El rebote intermedio pierde fuerza sin recuperar la estructura previa.",
            "La decisión utiliza el contexto mostrado, no el movimiento que se revelará después.",
          ],
        },
      },
    },
  },
  {
    id: "range-midpoint-001",
    version: 1,
    title: "Rango sin ventaja clara",
    prompt:
      "El precio lleva varias rotaciones dentro de la misma zona. Decide si existe una lectura suficientemente clara para actuar.",
    timeframe: "15m",
    source: {
      kind: "synthetic",
      label: "Escenario sintético · rango",
    },
    candles: buildCandles(rangeCloses, SYNTHETIC_START + 4 * 24 * 60 * 60 * 1000, 760),
    decisionIndex: 59,
    revealCount: 12,
    skills: [
      { skill: "range_reading", weight: 0.55 },
      { skill: "context_reading", weight: 0.2 },
      { skill: "discipline", weight: 0.25 },
    ],
    tradePlanRubrics: {
      long: {
        entry: {
          optimal: { min: 99.5, max: 100.0 },
          acceptable: { min: 99.1, max: 100.3 },
        },
        stop: {
          optimal: { min: 98.3, max: 98.8 },
          acceptable: { min: 97.9, max: 99.0 },
        },
        target: {
          optimal: { min: 101.2, max: 101.8 },
          acceptable: { min: 100.9, max: 102.2 },
        },
        minimumRewardRisk: 1.2,
        idealRewardRisk: 1.8,
        weights: {
          entry: 0.25,
          invalidation: 0.35,
          target: 0.2,
          rewardRisk: 0.2,
        },
      },
      short: {
        entry: {
          optimal: { min: 99.6, max: 100.2 },
          acceptable: { min: 99.3, max: 100.5 },
        },
        stop: {
          optimal: { min: 101.1, max: 101.8 },
          acceptable: { min: 100.8, max: 102.2 },
        },
        target: {
          optimal: { min: 98.4, max: 99.0 },
          acceptable: { min: 98.0, max: 99.2 },
        },
        minimumRewardRisk: 1.1,
        idealRewardRisk: 1.7,
        weights: {
          entry: 0.25,
          invalidation: 0.35,
          target: 0.2,
          rewardRisk: 0.2,
        },
      },
    },
    rubric: {
      version: 1,
      decisions: {
        long: {
          skillScores: {
            range_reading: 36,
            context_reading: 44,
            discipline: 34,
          },
          summary: "La dirección alcista no está suficientemente respaldada desde el centro del rango.",
          reasons: [
            "El precio sigue rotando sin romper de forma consistente los extremos del rango.",
            "La zona de decisión no ofrece una asimetría evidente solo con la información mostrada.",
            "Elegir dirección aquí fuerza una lectura que el contexto todavía no confirma.",
          ],
        },
        no_trade: {
          skillScores: {
            range_reading: 96,
            context_reading: 92,
            discipline: 98,
          },
          summary: "No operar es la decisión más sólida porque el contexto no ofrece una ventaja direccional clara.",
          reasons: [
            "La estructura visible es lateral y repetitiva.",
            "El precio se encuentra lejos de una ruptura confirmada o de un extremo claramente defendible.",
            "Esperar preserva disciplina cuando el escenario no justifica una dirección.",
          ],
        },
        short: {
          skillScores: {
            range_reading: 34,
            context_reading: 42,
            discipline: 35,
          },
          summary: "La dirección bajista tampoco está suficientemente respaldada desde el centro del rango.",
          reasons: [
            "La estructura sigue alternando impulsos en ambas direcciones.",
            "No existe una ruptura bajista confirmada en el punto de corte.",
            "Operar por anticipación añade convicción que el gráfico todavía no aporta.",
          ],
        },
      },
    },
  },
  {
    id: "false-breakout-001",
    version: 1,
    title: "Ruptura que pierde aceptación",
    prompt:
      "El precio acaba de superar una zona repetida y vuelve con rapidez hacia ella. Decide qué lectura está mejor justificada ahora.",
    timeframe: "15m",
    source: {
      kind: "synthetic",
      label: "Escenario sintético · falsa ruptura",
    },
    candles: buildCandles(
      falseBreakoutCloses,
      SYNTHETIC_START + 8 * 24 * 60 * 60 * 1000,
      1080,
    ),
    decisionIndex: 59,
    revealCount: 12,
    skills: [
      { skill: "false_breakout", weight: 0.5 },
      { skill: "context_reading", weight: 0.3 },
      { skill: "discipline", weight: 0.2 },
    ],
    tradePlanRubrics: {
      long: {
        entry: {
          optimal: { min: 100.7, max: 101.3 },
          acceptable: { min: 100.3, max: 101.6 },
        },
        stop: {
          optimal: { min: 99.6, max: 100.2 },
          acceptable: { min: 99.0, max: 100.4 },
        },
        target: {
          optimal: { min: 102.4, max: 103.4 },
          acceptable: { min: 102.0, max: 104.0 },
        },
        minimumRewardRisk: 1.2,
        idealRewardRisk: 2,
        weights: {
          entry: 0.25,
          invalidation: 0.35,
          target: 0.2,
          rewardRisk: 0.2,
        },
      },
      short: {
        entry: {
          optimal: { min: 100.7, max: 101.2 },
          acceptable: { min: 100.3, max: 101.6 },
        },
        stop: {
          optimal: { min: 102.0, max: 102.8 },
          acceptable: { min: 101.7, max: 103.4 },
        },
        target: {
          optimal: { min: 98.8, max: 99.8 },
          acceptable: { min: 98.0, max: 100.1 },
        },
        minimumRewardRisk: 1.2,
        idealRewardRisk: 2,
        weights: {
          entry: 0.25,
          invalidation: 0.35,
          target: 0.2,
          rewardRisk: 0.2,
        },
      },
    },
    rubric: {
      version: 1,
      decisions: {
        long: {
          skillScores: {
            false_breakout: 28,
            context_reading: 34,
            discipline: 30,
          },
          summary: "Perseguir la ruptura es débil después de que el precio haya perdido aceptación sobre la zona.",
          reasons: [
            "El impulso por encima del rango se revierte con rapidez.",
            "La continuidad alcista deja de estar confirmada en el punto de decisión.",
            "Entrar tarde convierte el movimiento previo en argumento, aunque ya esté deteriorándose.",
          ],
        },
        no_trade: {
          skillScores: {
            false_breakout: 94,
            context_reading: 90,
            discipline: 96,
          },
          summary: "Esperar es la opción más robusta mientras el mercado resuelve si la ruptura fue válida o fallida.",
          reasons: [
            "La ruptura reciente ha perdido aceptación y aumenta la ambigüedad.",
            "El precio vuelve a una zona donde pueden coexistir lecturas opuestas.",
            "No operar evita convertir una reacción violenta en una señal categórica.",
          ],
        },
        short: {
          skillScores: {
            false_breakout: 76,
            context_reading: 72,
            discipline: 64,
          },
          summary: "La lectura bajista es defendible, pero todavía exige asumir que el rechazo continuará.",
          reasons: [
            "La pérdida de aceptación sobre la ruptura favorece una lectura de fallo.",
            "La vuelta al rango debilita el argumento alcista previo.",
            "Sin evaluar entrada e invalidación todavía, no alcanza la calidad de la opción de esperar.",
          ],
        },
      },
    },
  },
] as const;

export function getDemoExercise(exerciseId: string): Exercise | undefined {
  return DEMO_EXERCISES.find((exercise) => exercise.id === exerciseId);
}
