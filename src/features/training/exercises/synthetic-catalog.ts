
import { DEMO_EXERCISES, getDemoExercise } from "./demo-exercises";
import { SYNTHETIC_EXERCISE_ARCHETYPES } from "../types";
import type {
  Candle,
  DirectionalDecision,
  Exercise,
  ExerciseManagementRubric,
  ExerciseRubric,
  ExerciseTimeframe,
  ManagementFixedActionRubric,
  ManagementMoveStopRubric,
  PriceZone,
  PriceZoneRubric,
  SyntheticExerciseArchetype,
  TradePlanRubric,
  TrainingDecision,
  TrainingSkill,
} from "../types";

export const SYNTHETIC_GENERATOR_VERSION = 2;
export const SYNTHETIC_MAX_SEED = 999_999_999;
export const SYNTHETIC_RECENT_EXERCISE_LIMIT = 64;
const SYNTHETIC_RECENT_SIGNATURE_LIMIT = 40;
export const SYNTHETIC_ARCHETYPES = SYNTHETIC_EXERCISE_ARCHETYPES;

export type { SyntheticExerciseArchetype } from "../types";

export type SyntheticExerciseDescriptor = {
  archetype: SyntheticExerciseArchetype;
  seed: number;
  generatorVersion: number;
};

export type SyntheticScenarioDiagnostics = {
  valid: boolean;
  issues: readonly string[];
  visibleRange: number;
  averageTrueRange: number;
  maxTrueRange: number;
};

type ArchetypeDefinition = {
  id: SyntheticExerciseArchetype;
  templateExerciseId?: string;
};

type SetupDirection = DirectionalDecision | "neutral";

type ScenarioTraits = {
  variant: number;
  timeframe: ExerciseTimeframe;
  setupDirection: SetupDirection;
  breakoutDirection: DirectionalDecision | null;
};

type ScenarioBlueprint = {
  closes: readonly number[];
  decisionIndex: number;
  revealCount: number;
  traits: ScenarioTraits;
};

type Segment = {
  target: number;
  candles: number;
  noise: number;
  curve?: number;
};

const ARCHETYPE_DEFINITIONS: readonly ArchetypeDefinition[] = [
  { id: "trend-continuation", templateExerciseId: "trend-continuation-001" },
  { id: "range-midpoint", templateExerciseId: "range-midpoint-001" },
  { id: "false-breakout", templateExerciseId: "false-breakout-001" },
  { id: "breakout-acceptance" },
  { id: "range-extreme" },
  { id: "compression" },
  { id: "exhaustion-reversal" },
  { id: "level-retest" },
] as const;

const GENERATED_ID_PATTERN = /^syn-([a-z0-9-]+)-g(\d+)-s(\d+)$/;
const SUPPORTED_GENERATOR_VERSIONS = new Set([1, SYNTHETIC_GENERATOR_VERSION]);
const LEGACY_V1_ARCHETYPES = new Set<SyntheticExerciseArchetype>([
  "trend-continuation",
  "range-midpoint",
  "false-breakout",
]);
const REVEAL_COUNT = 12;
const TIMEFRAME_OPTIONS: readonly ExerciseTimeframe[] = ["5m", "15m", "1h"];
const TIMEFRAME_MS: Record<ExerciseTimeframe, number> = {
  "5m": 5 * 60 * 1000,
  "15m": 15 * 60 * 1000,
  "1h": 60 * 60 * 1000,
};

function roundPrice(value: number) {
  return Number(value.toFixed(2));
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function hashText(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function createSyntheticSelectionSeed(parts: readonly string[]) {
  const hash = hashText(parts.join("|"));
  return hash === 0 ? 1 : hash;
}

function normalizeRandomSeed(value: number) {
  if (!Number.isFinite(value)) {
    throw new RangeError("La seed de selección debe ser un número finito.");
  }

  const normalized = Math.abs(Math.trunc(value)) % 4_294_967_295;
  return normalized === 0 ? 1 : normalized;
}

function createDeterministicRandom(seed: number, salt: string) {
  let state = (normalizeRandomSeed(seed) ^ hashText(salt)) >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function randomBetween(random: () => number, minimum: number, maximum: number) {
  return minimum + random() * (maximum - minimum);
}

function randomInt(random: () => number, minimum: number, maximum: number) {
  return Math.floor(randomBetween(random, minimum, maximum + 1));
}

function choose<T>(random: () => number, values: readonly T[]): T {
  return values[Math.floor(random() * values.length) % values.length];
}

function assertSyntheticSeed(seed: number) {
  if (!Number.isInteger(seed) || seed < 1 || seed > SYNTHETIC_MAX_SEED) {
    throw new RangeError(
      `La seed sintética debe estar entre 1 y ${SYNTHETIC_MAX_SEED}.`,
    );
  }
}

function getArchetypeDefinition(archetype: SyntheticExerciseArchetype) {
  const definition = ARCHETYPE_DEFINITIONS.find((item) => item.id === archetype);

  if (!definition) {
    throw new Error(`Arquetipo sintético no soportado: ${archetype}`);
  }

  return definition;
}

function getTemplateExercise(archetype: SyntheticExerciseArchetype) {
  const definition = getArchetypeDefinition(archetype);

  if (!definition.templateExerciseId) {
    throw new Error(`El arquetipo ${archetype} no tiene una plantilla legacy g1.`);
  }

  const exercise = getDemoExercise(definition.templateExerciseId);

  if (!exercise) {
    throw new Error(`No existe la plantilla base del arquetipo ${archetype}.`);
  }

  return exercise;
}

export function createSyntheticExerciseId(
  archetype: SyntheticExerciseArchetype,
  seed: number,
  generatorVersion = SYNTHETIC_GENERATOR_VERSION,
) {
  assertSyntheticSeed(seed);

  if (!Number.isInteger(generatorVersion) || generatorVersion < 1) {
    throw new RangeError("La versión del generador no es válida.");
  }

  return `syn-${archetype}-g${generatorVersion}-s${seed}`;
}

export function parseSyntheticExerciseId(
  exerciseId: string,
): SyntheticExerciseDescriptor | null {
  const match = GENERATED_ID_PATTERN.exec(exerciseId);

  if (!match) {
    return null;
  }

  const archetype = match[1] as SyntheticExerciseArchetype;
  const generatorVersion = Number(match[2]);
  const seed = Number(match[3]);

  if (
    !SYNTHETIC_ARCHETYPES.includes(archetype) ||
    !SUPPORTED_GENERATOR_VERSIONS.has(generatorVersion) ||
    (generatorVersion === 1 && !LEGACY_V1_ARCHETYPES.has(archetype)) ||
    !Number.isInteger(seed) ||
    seed < 1 ||
    seed > SYNTHETIC_MAX_SEED
  ) {
    return null;
  }

  return { archetype, seed, generatorVersion };
}

function getScenarioTraits(
  archetype: SyntheticExerciseArchetype,
  seed: number,
): ScenarioTraits {
  const random = createDeterministicRandom(seed, `${archetype}:traits:v2`);
  const timeframe = choose(random, TIMEFRAME_OPTIONS);
  const variant = randomInt(random, 0, 5);

  if (archetype === "range-midpoint" || archetype === "compression") {
    return {
      variant,
      timeframe,
      setupDirection: "neutral",
      breakoutDirection: null,
    };
  }

  const direction: DirectionalDecision = random() < 0.5 ? "long" : "short";

  if (archetype === "trend-continuation") {
    return {
      variant,
      timeframe,
      setupDirection: direction,
      breakoutDirection: null,
    };
  }

  if (archetype === "breakout-acceptance" || archetype === "level-retest") {
    return {
      variant,
      timeframe,
      setupDirection: direction,
      breakoutDirection: direction,
    };
  }

  return {
    variant,
    timeframe,
    setupDirection: direction === "long" ? "short" : "long",
    breakoutDirection: direction,
  };
}

function getSyntheticStructuralSignature(
  archetype: SyntheticExerciseArchetype,
  seed: number,
) {
  const traits = getScenarioTraits(archetype, seed);

  return [
    archetype,
    traits.variant,
    traits.timeframe,
    traits.setupDirection,
  ].join(":");
}

function getRecentStructuralSignatures(exerciseIds: readonly string[]) {
  const signatures = new Set<string>();

  for (const exerciseId of exerciseIds.slice(0, SYNTHETIC_RECENT_SIGNATURE_LIMIT)) {
    const descriptor = parseSyntheticExerciseId(exerciseId);

    if (!descriptor || descriptor.generatorVersion !== SYNTHETIC_GENERATOR_VERSION) {
      continue;
    }

    signatures.add(
      getSyntheticStructuralSignature(descriptor.archetype, descriptor.seed),
    );
  }

  return signatures;
}

function appendSegment(
  path: number[],
  segment: Segment,
  random: () => number,
) {
  const start = path[path.length - 1];
  const count = Math.max(3, Math.round(segment.candles));
  const delta = segment.target - start;
  const curve = segment.curve ?? randomBetween(random, 0.78, 1.24);
  const driftWeights: number[] = [];
  const rawNoise: number[] = [];
  let volatilityState = randomBetween(random, 0.72, 1.15);

  for (let index = 0; index < count; index += 1) {
    const t = (index + 0.5) / count;
    const curveWeight = Math.max(
      0.2,
      curve * Math.pow(Math.max(t, 0.02), curve - 1),
    );
    const pulse = 1 + Math.sin((t + randomBetween(random, -0.08, 0.08)) * Math.PI * 2) * 0.16;
    driftWeights.push(curveWeight * pulse * randomBetween(random, 0.72, 1.28));

    volatilityState = clamp(
      volatilityState * randomBetween(random, 0.82, 1.04) + randomBetween(random, -0.1, 0.16),
      0.55,
      1.7,
    );
    const innovation = (random() + random() + random() - 1.5) / 1.5;
    const shock = random() < 0.07 ? randomBetween(random, 1.35, 2.1) : 1;
    rawNoise.push(innovation * segment.noise * volatilityState * shock);
  }

  const driftTotal = driftWeights.reduce((total, value) => total + value, 0);
  const noiseMean = rawNoise.reduce((total, value) => total + value, 0) / count;
  let current = start;

  for (let index = 0; index < count; index += 1) {
    if (index === count - 1) {
      path.push(segment.target);
      break;
    }

    const drift = delta * (driftWeights[index] / driftTotal);
    const centeredNoise = rawNoise[index] - noiseMean;
    current += drift + centeredNoise;
    path.push(current);
  }
}

function buildPathFromLevels(options: {
  levels: readonly number[];
  unit: number;
  anchor: number;
  random: () => number;
  minimumCandles: number;
  maximumCandles: number;
  noiseShare: number;
}) {
  const path = [options.anchor + options.levels[0] * options.unit];

  for (let index = 1; index < options.levels.length; index += 1) {
    const distance = Math.abs(options.levels[index] - options.levels[index - 1]);
    const count = clamp(
      randomInt(options.random, options.minimumCandles, options.maximumCandles) +
        Math.round(distance * randomBetween(options.random, 0.25, 0.95)),
      3,
      14,
    );

    appendSegment(
      path,
      {
        target: options.anchor + options.levels[index] * options.unit,
        candles: count,
        noise:
          options.unit *
          options.noiseShare *
          randomBetween(options.random, 0.7, 1.35),
        curve: randomBetween(options.random, 0.76, 1.28),
      },
      options.random,
    );
  }

  return path;
}

function getTimeframeVolatility(timeframe: ExerciseTimeframe) {
  switch (timeframe) {
    case "5m":
      return 0.0036;
    case "15m":
      return 0.0062;
    case "1h":
      return 0.0105;
  }
}

function createMarketScale(random: () => number, timeframe: ExerciseTimeframe) {
  const anchor = randomBetween(random, 82, 158);
  const unit =
    anchor *
    getTimeframeVolatility(timeframe) *
    randomBetween(random, 0.82, 1.22);

  return { anchor, unit };
}

function createTrendLevels(
  variant: number,
  direction: DirectionalDecision,
  random: () => number,
) {
  const sign = direction === "long" ? 1 : -1;
  const cycleCounts = [3, 4, 4, 5, 3, 4] as const;
  const cycleCount = cycleCounts[variant];
  const levels: number[] = [0];
  let current = 0;

  for (let cycle = 0; cycle < cycleCount; cycle += 1) {
    const progress = cycle / (cycleCount - 1);
    let impulse = randomBetween(random, 0.82, 1.5);

    if (variant === 1) {
      impulse *= 0.88 + progress * 0.34;
    } else if (variant === 2) {
      impulse *= 1.18 - progress * 0.26;
    } else if (variant === 3) {
      impulse *= cycle % 2 === 0 ? 1.16 : 0.78;
    } else if (variant === 4) {
      impulse *= cycle === 1 ? 0.62 : 1.12;
    } else if (variant === 5) {
      impulse *= randomBetween(random, 0.72, 1.28);
    }

    current += sign * impulse;
    levels.push(current);

    if (variant === 4 && cycle === 1) {
      current += sign * impulse * randomBetween(random, 0.08, 0.18);
      levels.push(current);
      current -= sign * impulse * randomBetween(random, 0.07, 0.16);
      levels.push(current);
    }

    let pullbackRatio = randomBetween(random, 0.24, 0.48);

    if (variant === 0) {
      pullbackRatio = randomBetween(random, 0.28, 0.42);
    } else if (variant === 2 && cycle === 1) {
      pullbackRatio = randomBetween(random, 0.48, 0.62);
    } else if (variant === 3) {
      pullbackRatio = cycle % 2 === 0
        ? randomBetween(random, 0.18, 0.32)
        : randomBetween(random, 0.38, 0.55);
    } else if (variant === 5) {
      pullbackRatio = randomBetween(random, 0.18, 0.58);
    }

    if (cycle === cycleCount - 1) {
      pullbackRatio = randomBetween(random, 0.18, 0.36);
    }

    current -= sign * impulse * pullbackRatio;
    levels.push(current);
  }

  return levels;
}

function buildTrendBlueprint(seed: number, traits: ScenarioTraits): ScenarioBlueprint {
  const random = createDeterministicRandom(seed, "trend-continuation:v2:path");
  const direction = traits.setupDirection as DirectionalDecision;
  const sign = direction === "long" ? 1 : -1;
  const { anchor, unit } = createMarketScale(random, traits.timeframe);
  const visible = buildPathFromLevels({
    levels: createTrendLevels(traits.variant, direction, random),
    anchor,
    unit,
    random,
    minimumCandles: 5,
    maximumCandles: 8,
    noiseShare: 0.4,
  });
  const decisionIndex = visible.length - 1;
  const decisionLevel = visible[decisionIndex];
  const extension = unit * randomBetween(random, 0.9, 1.35);
  const closes = [...visible];
  const futureTargets = [
    decisionLevel + sign * extension * randomBetween(random, 0.55, 0.9),
    decisionLevel + sign * extension * randomBetween(random, 1.25, 1.75),
    decisionLevel + sign * extension * randomBetween(random, 2.0, 2.75),
  ];

  futureTargets.forEach((target) => {
    appendSegment(
      closes,
      {
        target,
        candles: 4,
        noise: unit * randomBetween(random, 0.19, 0.34),
        curve: randomBetween(random, 0.78, 1.22),
      },
      random,
    );
  });

  appendSegment(
    closes,
    {
      target:
        closes[closes.length - 1] -
        sign * unit * randomBetween(random, 0.14, 0.42),
      candles: 3,
      noise: unit * 0.2,
    },
    random,
  );

  return { closes, decisionIndex, revealCount: REVEAL_COUNT, traits };
}

function getRangeWidthScale(variant: number, progress: number) {
  switch (variant) {
    case 1:
      return 1 - progress * 0.28;
    case 2:
      return 0.72 + progress * 0.3;
    default:
      return 1;
  }
}

function getRangeCenterDrift(variant: number, progress: number) {
  if (variant === 3) {
    return progress * 0.2;
  }

  if (variant === 4) {
    return -progress * 0.2;
  }

  return 0;
}

function createRangeLevels(variant: number, random: () => number) {
  const rotationCounts = [5, 6, 5, 6, 5, 7] as const;
  const rotationCount = rotationCounts[variant];
  const levels: number[] = [randomBetween(random, -0.24, 0.24)];
  let side = random() < 0.5 ? -1 : 1;

  for (let rotation = 0; rotation < rotationCount; rotation += 1) {
    const progress = rotation / (rotationCount - 1);
    const widthScale = getRangeWidthScale(variant, progress);
    const center = getRangeCenterDrift(variant, progress);
    let reach = randomBetween(random, 0.74, 1.02);

    if (variant === 5 && random() < 0.34) {
      reach = randomBetween(random, 0.46, 0.72);
    } else if (random() < 0.12) {
      reach = randomBetween(random, 0.58, 0.78);
    }

    const extreme = center + side * widthScale * reach;
    levels.push(extreme);

    const retestChance = variant === 5 ? 0.62 : 0.38;
    if (random() < retestChance) {
      const retrace = center + side * widthScale * reach * randomBetween(random, 0.34, 0.62);
      levels.push(retrace);

      if (random() < 0.58) {
        levels.push(
          center + side * widthScale * reach * randomBetween(random, 0.72, 0.96),
        );
      }
    }

    side *= -1;
  }

  const finalProgress = 1;
  levels.push(
    getRangeCenterDrift(variant, finalProgress) +
      randomBetween(random, -0.16, 0.16),
  );

  return levels;
}

function buildRangeBlueprint(seed: number, traits: ScenarioTraits): ScenarioBlueprint {
  const random = createDeterministicRandom(seed, "range-midpoint:v2:path");
  const { anchor, unit } = createMarketScale(random, traits.timeframe);
  const halfWidth = unit * randomBetween(random, 2.4, 3.75);
  const visible = buildPathFromLevels({
    levels: createRangeLevels(traits.variant, random),
    anchor,
    unit: halfWidth,
    random,
    minimumCandles: 4,
    maximumCandles: 6,
    noiseShare: 0.22,
  });
  const decisionIndex = visible.length - 1;
  const closes = [...visible];
  const futureDirection = random() < 0.5 ? -1 : 1;
  const futureTargets = [
    anchor + futureDirection * halfWidth * randomBetween(random, 0.45, 0.72),
    anchor - futureDirection * halfWidth * randomBetween(random, 0.35, 0.68),
    anchor + randomBetween(random, -0.18, 0.18) * halfWidth,
  ];

  futureTargets.forEach((target) => {
    appendSegment(
      closes,
      {
        target,
        candles: 4,
        noise: halfWidth * randomBetween(random, 0.075, 0.13),
        curve: randomBetween(random, 0.78, 1.24),
      },
      random,
    );
  });

  appendSegment(
    closes,
    {
      target: anchor + randomBetween(random, -0.24, 0.24) * halfWidth,
      candles: 3,
      noise: halfWidth * 0.08,
    },
    random,
  );

  return { closes, decisionIndex, revealCount: REVEAL_COUNT, traits };
}

function createFalseBreakoutLevels(
  variant: number,
  breakoutDirection: DirectionalDecision,
  random: () => number,
) {
  const breakoutSign = breakoutDirection === "long" ? 1 : -1;
  const levels: number[] = [randomBetween(random, -0.2, 0.2)];
  const rotationCount = 3 + (variant % 3);
  let side = random() < 0.5 ? -1 : 1;

  for (let rotation = 0; rotation < rotationCount; rotation += 1) {
    let reach = randomBetween(random, 0.68, 0.98);

    if (random() < 0.2) {
      reach = randomBetween(random, 0.5, 0.72);
    }

    const extreme = side * reach + randomBetween(random, -0.06, 0.06);
    levels.push(extreme);

    if (random() < 0.34) {
      levels.push(side * reach * randomBetween(random, 0.34, 0.58));
      if (random() < 0.5) {
        levels.push(side * reach * randomBetween(random, 0.7, 0.94));
      }
    }

    side *= -1;
  }

  const boundaryApproach = breakoutSign * randomBetween(random, 0.72, 0.94);
  levels.push(boundaryApproach);

  switch (variant) {
    case 0:
      levels.push(
        breakoutSign * randomBetween(random, 1.12, 1.34),
        breakoutSign * randomBetween(random, 0.62, 0.82),
        breakoutSign * randomBetween(random, 0.18, 0.38),
      );
      break;
    case 1:
      levels.push(
        breakoutSign * randomBetween(random, 1.05, 1.18),
        breakoutSign * randomBetween(random, 1.18, 1.38),
        breakoutSign * randomBetween(random, 1.02, 1.18),
        breakoutSign * randomBetween(random, 0.58, 0.78),
        breakoutSign * randomBetween(random, 0.16, 0.34),
      );
      break;
    case 2:
      levels.push(
        breakoutSign * randomBetween(random, 1.22, 1.48),
        breakoutSign * randomBetween(random, 0.78, 0.96),
        breakoutSign * randomBetween(random, 1.06, 1.25),
        breakoutSign * randomBetween(random, 0.54, 0.74),
        breakoutSign * randomBetween(random, 0.14, 0.3),
      );
      break;
    case 3:
      levels.push(
        breakoutSign * randomBetween(random, 1.02, 1.16),
        breakoutSign * randomBetween(random, 0.82, 0.96),
        breakoutSign * randomBetween(random, 1.2, 1.4),
        breakoutSign * randomBetween(random, 0.68, 0.84),
        breakoutSign * randomBetween(random, 0.12, 0.3),
      );
      break;
    case 4:
      levels.push(
        breakoutSign * randomBetween(random, 1.18, 1.36),
        breakoutSign * randomBetween(random, 0.9, 1.02),
        breakoutSign * randomBetween(random, 1.08, 1.2),
        breakoutSign * randomBetween(random, 0.52, 0.72),
        breakoutSign * randomBetween(random, 0.12, 0.28),
      );
      break;
    case 5:
      levels.push(
        breakoutSign * randomBetween(random, 0.98, 1.1),
        breakoutSign * randomBetween(random, 1.06, 1.17),
        breakoutSign * randomBetween(random, 1.14, 1.3),
        breakoutSign * randomBetween(random, 0.88, 1.02),
        breakoutSign * randomBetween(random, 0.48, 0.68),
        breakoutSign * randomBetween(random, 0.1, 0.26),
      );
      break;
  }

  return levels;
}

function buildFalseBreakoutBlueprint(
  seed: number,
  traits: ScenarioTraits,
): ScenarioBlueprint {
  const random = createDeterministicRandom(seed, "false-breakout:v2:path");
  const breakoutDirection = traits.breakoutDirection as DirectionalDecision;
  const breakoutSign = breakoutDirection === "long" ? 1 : -1;
  const { anchor, unit } = createMarketScale(random, traits.timeframe);
  const halfWidth = unit * randomBetween(random, 2.15, 3.2);
  const visible = buildPathFromLevels({
    levels: createFalseBreakoutLevels(traits.variant, breakoutDirection, random),
    anchor,
    unit: halfWidth,
    random,
    minimumCandles: 4,
    maximumCandles: 6,
    noiseShare: 0.19,
  });
  const decisionIndex = visible.length - 1;
  const closes = [...visible];
  const reversalSign = -breakoutSign;
  const futureTargets = [
    anchor + reversalSign * halfWidth * randomBetween(random, 0.16, 0.32),
    anchor + reversalSign * halfWidth * randomBetween(random, 0.42, 0.62),
    anchor + reversalSign * halfWidth * randomBetween(random, 0.64, 0.86),
  ];

  futureTargets.forEach((target) => {
    appendSegment(
      closes,
      {
        target,
        candles: 4,
        noise: halfWidth * randomBetween(random, 0.07, 0.12),
        curve: randomBetween(random, 0.76, 1.2),
      },
      random,
    );
  });

  appendSegment(
    closes,
    {
      target:
        closes[closes.length - 1] -
        reversalSign * halfWidth * randomBetween(random, 0.04, 0.12),
      candles: 3,
      noise: halfWidth * 0.07,
    },
    random,
  );

  return { closes, decisionIndex, revealCount: REVEAL_COUNT, traits };
}


function createBreakoutAcceptanceLevels(
  variant: number,
  direction: DirectionalDecision,
  random: () => number,
) {
  const sign = direction === "long" ? 1 : -1;
  const levels: number[] = [randomBetween(random, -0.18, 0.18)];
  let side = random() < 0.5 ? -1 : 1;
  const rotations = 3 + (variant % 2);

  for (let rotation = 0; rotation < rotations; rotation += 1) {
    const reach = randomBetween(random, 0.62, 0.92);
    levels.push(side * reach + randomBetween(random, -0.05, 0.05));

    if (random() < 0.45) {
      levels.push(side * reach * randomBetween(random, 0.28, 0.52));
    }

    side *= -1;
  }

  levels.push(sign * randomBetween(random, 0.78, 0.94));

  switch (variant) {
    case 0:
      levels.push(
        sign * randomBetween(random, 1.12, 1.28),
        sign * randomBetween(random, 1.02, 1.1),
        sign * randomBetween(random, 1.18, 1.34),
        sign * randomBetween(random, 1.11, 1.24),
      );
      break;
    case 1:
      levels.push(
        sign * randomBetween(random, 1.05, 1.16),
        sign * randomBetween(random, 1.18, 1.34),
        sign * randomBetween(random, 1.04, 1.12),
        sign * randomBetween(random, 1.25, 1.42),
        sign * randomBetween(random, 1.16, 1.3),
      );
      break;
    case 2:
      levels.push(
        sign * randomBetween(random, 0.9, 0.98),
        sign * randomBetween(random, 1.08, 1.2),
        sign * randomBetween(random, 1.03, 1.09),
        sign * randomBetween(random, 1.16, 1.28),
      );
      break;
    case 3:
      levels.push(
        sign * randomBetween(random, 1.28, 1.5),
        sign * randomBetween(random, 1.12, 1.24),
        sign * randomBetween(random, 1.34, 1.54),
        sign * randomBetween(random, 1.22, 1.36),
      );
      break;
    case 4:
      levels.push(
        sign * randomBetween(random, 1.12, 1.24),
        sign * randomBetween(random, 1.01, 1.07),
        sign * randomBetween(random, 1.1, 1.2),
        sign * randomBetween(random, 1.04, 1.11),
        sign * randomBetween(random, 1.2, 1.34),
      );
      break;
    case 5:
      levels.push(
        sign * randomBetween(random, 1.06, 1.14),
        sign * randomBetween(random, 1.16, 1.26),
        sign * randomBetween(random, 1.09, 1.16),
        sign * randomBetween(random, 1.28, 1.4),
        sign * randomBetween(random, 1.18, 1.3),
      );
      break;
  }

  return levels;
}

function buildBreakoutAcceptanceBlueprint(
  seed: number,
  traits: ScenarioTraits,
): ScenarioBlueprint {
  const random = createDeterministicRandom(seed, "breakout-acceptance:v2:path");
  const direction = traits.setupDirection as DirectionalDecision;
  const sign = direction === "long" ? 1 : -1;
  const { anchor, unit } = createMarketScale(random, traits.timeframe);
  const halfWidth = unit * randomBetween(random, 2.2, 3.4);
  const visible = buildPathFromLevels({
    levels: createBreakoutAcceptanceLevels(traits.variant, direction, random),
    anchor,
    unit: halfWidth,
    random,
    minimumCandles: 4,
    maximumCandles: 7,
    noiseShare: 0.16,
  });
  const decisionIndex = visible.length - 1;
  const closes = [...visible];
  const decisionLevel = visible[decisionIndex];
  const futureTargets = [
    decisionLevel + sign * halfWidth * randomBetween(random, 0.22, 0.38),
    decisionLevel + sign * halfWidth * randomBetween(random, 0.52, 0.78),
    decisionLevel + sign * halfWidth * randomBetween(random, 0.86, 1.18),
  ];

  futureTargets.forEach((target) => {
    appendSegment(
      closes,
      {
        target,
        candles: 4,
        noise: halfWidth * randomBetween(random, 0.06, 0.11),
        curve: randomBetween(random, 0.78, 1.22),
      },
      random,
    );
  });

  appendSegment(
    closes,
    {
      target: closes[closes.length - 1] - sign * halfWidth * randomBetween(random, 0.06, 0.16),
      candles: 3,
      noise: halfWidth * 0.07,
    },
    random,
  );

  return { closes, decisionIndex, revealCount: REVEAL_COUNT, traits };
}

function createRangeExtremeLevels(
  variant: number,
  testedDirection: DirectionalDecision,
  random: () => number,
) {
  const testedSign = testedDirection === "long" ? 1 : -1;
  const levels: number[] = [randomBetween(random, -0.2, 0.2)];
  let side = random() < 0.5 ? -1 : 1;
  const rotations = 4 + (variant % 3);

  for (let rotation = 0; rotation < rotations; rotation += 1) {
    const reach = randomBetween(random, 0.66, 0.96);
    levels.push(side * reach + randomBetween(random, -0.04, 0.04));

    if (random() < 0.38) {
      levels.push(side * reach * randomBetween(random, 0.3, 0.58));
    }

    side *= -1;
  }

  const firstTest = testedSign * randomBetween(random, 0.88, 0.99);
  levels.push(firstTest);

  switch (variant) {
    case 0:
      levels.push(
        testedSign * randomBetween(random, 0.64, 0.76),
        testedSign * randomBetween(random, 0.78, 0.9),
        testedSign * randomBetween(random, 0.58, 0.72),
      );
      break;
    case 1:
      levels.push(
        testedSign * randomBetween(random, 0.72, 0.84),
        testedSign * randomBetween(random, 0.92, 1.0),
        testedSign * randomBetween(random, 0.62, 0.74),
      );
      break;
    case 2:
      levels.push(
        testedSign * randomBetween(random, 0.52, 0.66),
        testedSign * randomBetween(random, 0.74, 0.86),
        testedSign * randomBetween(random, 0.5, 0.64),
      );
      break;
    case 3:
      levels.push(
        testedSign * randomBetween(random, 0.8, 0.9),
        testedSign * randomBetween(random, 0.9, 0.98),
        testedSign * randomBetween(random, 0.68, 0.78),
      );
      break;
    case 4:
      levels.push(
        testedSign * randomBetween(random, 0.6, 0.72),
        testedSign * randomBetween(random, 0.82, 0.93),
        testedSign * randomBetween(random, 0.56, 0.68),
      );
      break;
    case 5:
      levels.push(
        testedSign * randomBetween(random, 0.7, 0.82),
        testedSign * randomBetween(random, 0.86, 0.95),
        testedSign * randomBetween(random, 0.76, 0.86),
        testedSign * randomBetween(random, 0.58, 0.7),
      );
      break;
  }

  return levels;
}

function buildRangeExtremeBlueprint(
  seed: number,
  traits: ScenarioTraits,
): ScenarioBlueprint {
  const random = createDeterministicRandom(seed, "range-extreme:v2:path");
  const testedDirection = traits.breakoutDirection as DirectionalDecision;
  const testedSign = testedDirection === "long" ? 1 : -1;
  const reversalDirection = traits.setupDirection as DirectionalDecision;
  const reversalSign = reversalDirection === "long" ? 1 : -1;
  const { anchor, unit } = createMarketScale(random, traits.timeframe);
  const halfWidth = unit * randomBetween(random, 2.35, 3.65);
  const visible = buildPathFromLevels({
    levels: createRangeExtremeLevels(traits.variant, testedDirection, random),
    anchor,
    unit: halfWidth,
    random,
    minimumCandles: 4,
    maximumCandles: 7,
    noiseShare: 0.18,
  });
  const decisionIndex = visible.length - 1;
  const closes = [...visible];
  const futureTargets = [
    anchor + testedSign * halfWidth * randomBetween(random, 0.18, 0.34),
    anchor + reversalSign * halfWidth * randomBetween(random, 0.18, 0.38),
    anchor + reversalSign * halfWidth * randomBetween(random, 0.52, 0.78),
  ];

  futureTargets.forEach((target) => {
    appendSegment(
      closes,
      {
        target,
        candles: 4,
        noise: halfWidth * randomBetween(random, 0.07, 0.12),
        curve: randomBetween(random, 0.8, 1.22),
      },
      random,
    );
  });

  appendSegment(
    closes,
    {
      target: anchor + reversalSign * halfWidth * randomBetween(random, 0.42, 0.66),
      candles: 3,
      noise: halfWidth * 0.08,
    },
    random,
  );

  return { closes, decisionIndex, revealCount: REVEAL_COUNT, traits };
}

function createCompressionLevels(variant: number, random: () => number) {
  const levels: number[] = [randomBetween(random, -0.16, 0.16)];
  const rotations = 7 + (variant % 2);
  let side = random() < 0.5 ? -1 : 1;

  for (let rotation = 0; rotation < rotations; rotation += 1) {
    const progress = rotation / Math.max(rotations - 1, 1);
    const contraction = 1 - progress * randomBetween(random, 0.55, 0.72);
    let center = 0;

    if (variant === 1) {
      center = progress * 0.2;
    } else if (variant === 2) {
      center = -progress * 0.2;
    } else if (variant === 3) {
      center = Math.sin(progress * Math.PI) * 0.12;
    } else if (variant === 4) {
      center = progress * randomBetween(random, -0.12, 0.12);
    } else if (variant === 5) {
      center = rotation % 2 === 0 ? 0.06 : -0.06;
    }

    let reach = contraction * randomBetween(random, 0.7, 0.98);

    if (variant === 4 && rotation < 2) {
      reach *= randomBetween(random, 1.05, 1.22);
    }

    levels.push(center + side * reach);

    if (random() < 0.42) {
      levels.push(center + side * reach * randomBetween(random, 0.28, 0.5));
    }

    side *= -1;
  }

  levels.push(randomBetween(random, -0.12, 0.12));
  return levels;
}

function buildCompressionBlueprint(seed: number, traits: ScenarioTraits): ScenarioBlueprint {
  const random = createDeterministicRandom(seed, "compression:v2:path");
  const { anchor, unit } = createMarketScale(random, traits.timeframe);
  const halfWidth = unit * randomBetween(random, 2.1, 3.2);
  const visible = buildPathFromLevels({
    levels: createCompressionLevels(traits.variant, random),
    anchor,
    unit: halfWidth,
    random,
    minimumCandles: 3,
    maximumCandles: 6,
    noiseShare: 0.13,
  });
  const decisionIndex = visible.length - 1;
  const closes = [...visible];
  const expansionSign = random() < 0.5 ? -1 : 1;
  const futureTargets = [
    anchor + expansionSign * halfWidth * randomBetween(random, 0.5, 0.72),
    anchor + expansionSign * halfWidth * randomBetween(random, 1.02, 1.32),
    anchor + expansionSign * halfWidth * randomBetween(random, 1.34, 1.72),
  ];

  futureTargets.forEach((target, index) => {
    appendSegment(
      closes,
      {
        target,
        candles: index === 0 ? 3 : 4,
        noise: halfWidth * randomBetween(random, 0.055, 0.1),
        curve: randomBetween(random, 0.72, 1.18),
      },
      random,
    );
  });

  appendSegment(
    closes,
    {
      target: closes[closes.length - 1] - expansionSign * halfWidth * randomBetween(random, 0.08, 0.2),
      candles: 3,
      noise: halfWidth * 0.07,
    },
    random,
  );

  return { closes, decisionIndex, revealCount: REVEAL_COUNT, traits };
}

function createExhaustionLevels(
  variant: number,
  trendDirection: DirectionalDecision,
  random: () => number,
) {
  const sign = trendDirection === "long" ? 1 : -1;
  const levels: number[] = [0];
  let current = 0;
  let previousImpulse = randomBetween(random, 1.05, 1.45);
  const cycles = 4 + (variant % 2);

  for (let cycle = 0; cycle < cycles; cycle += 1) {
    const decay = clamp(1 - cycle * randomBetween(random, 0.09, 0.16), 0.48, 1);
    const impulse = previousImpulse * decay * randomBetween(random, 0.88, 1.08);
    current += sign * impulse;
    levels.push(current);

    const pullbackRatio = clamp(
      randomBetween(random, 0.26, 0.4) + cycle * randomBetween(random, 0.035, 0.07),
      0.24,
      0.62,
    );
    current -= sign * impulse * pullbackRatio;
    levels.push(current);
    previousImpulse = impulse;
  }

  const finalPush = previousImpulse * randomBetween(random, 0.28, 0.58);
  current += sign * finalPush;
  levels.push(current);

  if (variant === 1 || variant === 4) {
    current += sign * finalPush * randomBetween(random, 0.12, 0.28);
    levels.push(current);
  }

  const rejectionRatio = variant <= 2
    ? randomBetween(random, 0.9, 1.35)
    : randomBetween(random, 0.55, 0.88);
  current -= sign * previousImpulse * rejectionRatio;
  levels.push(current);

  if (variant === 2 || variant === 5) {
    current += sign * previousImpulse * randomBetween(random, 0.12, 0.28);
    levels.push(current);
    current -= sign * previousImpulse * randomBetween(random, 0.22, 0.42);
    levels.push(current);
  }

  return levels;
}

function buildExhaustionBlueprint(seed: number, traits: ScenarioTraits): ScenarioBlueprint {
  const random = createDeterministicRandom(seed, "exhaustion-reversal:v2:path");
  const trendDirection = traits.breakoutDirection as DirectionalDecision;
  const reversalDirection = traits.setupDirection as DirectionalDecision;
  const reversalSign = reversalDirection === "long" ? 1 : -1;
  const { anchor, unit } = createMarketScale(random, traits.timeframe);
  const visible = buildPathFromLevels({
    levels: createExhaustionLevels(traits.variant, trendDirection, random),
    anchor,
    unit: unit * randomBetween(random, 1.08, 1.42),
    random,
    minimumCandles: 4,
    maximumCandles: 7,
    noiseShare: 0.31,
  });
  const decisionIndex = visible.length - 1;
  const closes = [...visible];
  const decisionLevel = visible[decisionIndex];
  const extension = unit * randomBetween(random, 1.2, 1.7);
  const futureTargets = [
    decisionLevel + reversalSign * extension * randomBetween(random, 0.42, 0.68),
    decisionLevel + reversalSign * extension * randomBetween(random, 0.92, 1.28),
    decisionLevel + reversalSign * extension * randomBetween(random, 1.42, 1.92),
  ];

  futureTargets.forEach((target) => {
    appendSegment(
      closes,
      {
        target,
        candles: 4,
        noise: unit * randomBetween(random, 0.22, 0.38),
        curve: randomBetween(random, 0.75, 1.22),
      },
      random,
    );
  });

  appendSegment(
    closes,
    {
      target: closes[closes.length - 1] - reversalSign * unit * randomBetween(random, 0.18, 0.42),
      candles: 3,
      noise: unit * 0.24,
    },
    random,
  );

  return { closes, decisionIndex, revealCount: REVEAL_COUNT, traits };
}

function createLevelRetestLevels(
  variant: number,
  direction: DirectionalDecision,
  random: () => number,
) {
  const sign = direction === "long" ? 1 : -1;
  const levels: number[] = [0];
  const opposite = -sign;

  levels.push(
    sign * randomBetween(random, 0.72, 0.94),
    opposite * randomBetween(random, 0.14, 0.34),
    sign * randomBetween(random, 0.88, 1.02),
  );

  if (variant === 1 || variant === 4) {
    levels.push(sign * randomBetween(random, 0.62, 0.78));
    levels.push(sign * randomBetween(random, 0.92, 1.04));
  } else {
    levels.push(opposite * randomBetween(random, 0.02, 0.22));
  }

  switch (variant) {
    case 0:
      levels.push(
        sign * randomBetween(random, 1.24, 1.42),
        sign * randomBetween(random, 1.02, 1.1),
        sign * randomBetween(random, 1.16, 1.28),
      );
      break;
    case 1:
      levels.push(
        sign * randomBetween(random, 1.12, 1.24),
        sign * randomBetween(random, 1.32, 1.48),
        sign * randomBetween(random, 1.06, 1.14),
        sign * randomBetween(random, 1.2, 1.32),
      );
      break;
    case 2:
      levels.push(
        sign * randomBetween(random, 1.34, 1.56),
        sign * randomBetween(random, 1.08, 1.18),
        sign * randomBetween(random, 1.12, 1.2),
        sign * randomBetween(random, 1.26, 1.38),
      );
      break;
    case 3:
      levels.push(
        sign * randomBetween(random, 1.18, 1.3),
        sign * randomBetween(random, 1.0, 1.08),
        sign * randomBetween(random, 1.1, 1.2),
        sign * randomBetween(random, 1.22, 1.34),
      );
      break;
    case 4:
      levels.push(
        sign * randomBetween(random, 1.08, 1.18),
        sign * randomBetween(random, 1.26, 1.4),
        sign * randomBetween(random, 1.04, 1.12),
        sign * randomBetween(random, 1.18, 1.28),
      );
      break;
    case 5:
      levels.push(
        sign * randomBetween(random, 1.28, 1.46),
        sign * randomBetween(random, 1.14, 1.24),
        sign * randomBetween(random, 1.02, 1.1),
        sign * randomBetween(random, 1.2, 1.34),
      );
      break;
  }

  return levels;
}

function buildLevelRetestBlueprint(seed: number, traits: ScenarioTraits): ScenarioBlueprint {
  const random = createDeterministicRandom(seed, "level-retest:v2:path");
  const direction = traits.setupDirection as DirectionalDecision;
  const sign = direction === "long" ? 1 : -1;
  const { anchor, unit } = createMarketScale(random, traits.timeframe);
  const structureUnit = unit * randomBetween(random, 1.75, 2.45);
  const visible = buildPathFromLevels({
    levels: createLevelRetestLevels(traits.variant, direction, random),
    anchor,
    unit: structureUnit,
    random,
    minimumCandles: 4,
    maximumCandles: 7,
    noiseShare: 0.18,
  });
  const decisionIndex = visible.length - 1;
  const closes = [...visible];
  const decisionLevel = visible[decisionIndex];
  const futureTargets = [
    decisionLevel + sign * structureUnit * randomBetween(random, 0.16, 0.28),
    decisionLevel + sign * structureUnit * randomBetween(random, 0.38, 0.58),
    decisionLevel + sign * structureUnit * randomBetween(random, 0.66, 0.94),
  ];

  futureTargets.forEach((target) => {
    appendSegment(
      closes,
      {
        target,
        candles: 4,
        noise: structureUnit * randomBetween(random, 0.055, 0.095),
        curve: randomBetween(random, 0.8, 1.2),
      },
      random,
    );
  });

  appendSegment(
    closes,
    {
      target: closes[closes.length - 1] - sign * structureUnit * randomBetween(random, 0.05, 0.14),
      candles: 3,
      noise: structureUnit * 0.065,
    },
    random,
  );

  return { closes, decisionIndex, revealCount: REVEAL_COUNT, traits };
}

function buildBlueprint(
  archetype: SyntheticExerciseArchetype,
  seed: number,
): ScenarioBlueprint {
  const traits = getScenarioTraits(archetype, seed);

  switch (archetype) {
    case "trend-continuation":
      return buildTrendBlueprint(seed, traits);
    case "range-midpoint":
      return buildRangeBlueprint(seed, traits);
    case "false-breakout":
      return buildFalseBreakoutBlueprint(seed, traits);
    case "breakout-acceptance":
      return buildBreakoutAcceptanceBlueprint(seed, traits);
    case "range-extreme":
      return buildRangeExtremeBlueprint(seed, traits);
    case "compression":
      return buildCompressionBlueprint(seed, traits);
    case "exhaustion-reversal":
      return buildExhaustionBlueprint(seed, traits);
    case "level-retest":
      return buildLevelRetestBlueprint(seed, traits);
  }
}

function average(values: readonly number[]) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function buildCandlesFromCloses(
  blueprint: ScenarioBlueprint,
  seed: number,
): readonly Candle[] {
  const random = createDeterministicRandom(seed, "ohlcv:v2");
  const closes = blueprint.closes.map(roundPrice);
  const changes = closes.slice(1).map((close, index) => Math.abs(close - closes[index]));
  const averageChange = Math.max(average(changes), 0.02);
  const baseVolume = randomInt(random, 680, 1_450);
  const startTimestamp =
    Date.UTC(2024, 0, 1, 0, 0, 0) +
    (seed % 120_000) * TIMEFRAME_MS[blueprint.traits.timeframe];

  return closes.map((close, index) => {
    const open = index === 0
      ? roundPrice(close + randomBetween(random, -0.45, 0.45) * averageChange)
      : closes[index - 1];
    const body = Math.abs(close - open);
    const activity = clamp(body / averageChange, 0.15, 3.4);
    const longWick = random() < 0.075;
    const wickBase =
      averageChange *
      randomBetween(random, 0.32, longWick ? 1.35 : 0.86);
    const upperWick = wickBase * randomBetween(random, 0.72, 1.35);
    const lowerWick = wickBase * randomBetween(random, 0.72, 1.35);
    const high = roundPrice(Math.max(open, close) + upperWick);
    const low = roundPrice(Math.max(0.01, Math.min(open, close) - lowerWick));
    const volumeNoise = randomBetween(random, 0.78, 1.24);
    const volume = Math.round(baseVolume * volumeNoise * (0.78 + activity * 0.24));

    return {
      timestamp: startTimestamp + index * TIMEFRAME_MS[blueprint.traits.timeframe],
      open,
      high,
      low,
      close,
      volume,
    };
  });
}

function zoneAround(center: number, optimalHalfWidth: number, acceptableHalfWidth: number): PriceZoneRubric {
  return {
    optimal: {
      min: roundPrice(center - optimalHalfWidth),
      max: roundPrice(center + optimalHalfWidth),
    },
    acceptable: {
      min: roundPrice(center - acceptableHalfWidth),
      max: roundPrice(center + acceptableHalfWidth),
    },
  };
}

function getAverageTrueRange(candles: readonly Candle[], count = 14) {
  const recent = candles.slice(-count);
  return average(recent.map((candle) => candle.high - candle.low));
}

function getTradePlanRewardRisk(archetype: SyntheticExerciseArchetype) {
  switch (archetype) {
    case "trend-continuation":
      return { minimum: 1.25, ideal: 2.15 };
    case "range-midpoint":
      return { minimum: 1.05, ideal: 1.65 };
    case "false-breakout":
      return { minimum: 1.25, ideal: 1.9 };
    case "breakout-acceptance":
      return { minimum: 1.2, ideal: 2.05 };
    case "range-extreme":
      return { minimum: 1.05, ideal: 1.65 };
    case "compression":
      return { minimum: 1.0, ideal: 1.5 };
    case "exhaustion-reversal":
      return { minimum: 1.1, ideal: 1.8 };
    case "level-retest":
      return { minimum: 1.2, ideal: 2.0 };
  }
}

function buildDirectionalPlanRubric(
  candles: readonly Candle[],
  decision: DirectionalDecision,
  archetype: SyntheticExerciseArchetype,
): TradePlanRubric {
  const recent = candles.slice(-14);
  const entry = recent[recent.length - 1].close;
  const atr = Math.max(getAverageTrueRange(recent), entry * 0.0015);
  const recentLow = Math.min(...recent.map((candle) => candle.low));
  const recentHigh = Math.max(...recent.map((candle) => candle.high));
  const structuralRisk = decision === "long"
    ? entry - recentLow + atr * 0.18
    : recentHigh - entry + atr * 0.18;
  const risk = clamp(structuralRisk, atr * 1.05, atr * 2.65);
  const rewardRisk = getTradePlanRewardRisk(archetype);
  const idealRewardRisk = rewardRisk.ideal;
  const minimumRewardRisk = rewardRisk.minimum;
  const stop = decision === "long" ? entry - risk : entry + risk;
  const target = decision === "long"
    ? entry + risk * idealRewardRisk
    : entry - risk * idealRewardRisk;

  return {
    entry: zoneAround(entry, atr * 0.12, atr * 0.38),
    stop: zoneAround(stop, atr * 0.16, atr * 0.42),
    target: zoneAround(target, atr * 0.3, atr * 0.72),
    minimumRewardRisk,
    idealRewardRisk,
    weights: {
      entry: 0.25,
      invalidation: 0.35,
      target: 0.2,
      rewardRisk: 0.2,
    },
  };
}

function buildTradePlanRubrics(
  visibleCandles: readonly Candle[],
  archetype: SyntheticExerciseArchetype,
): Record<DirectionalDecision, TradePlanRubric> {
  return {
    long: buildDirectionalPlanRubric(visibleCandles, "long", archetype),
    short: buildDirectionalPlanRubric(visibleCandles, "short", archetype),
  };
}

function fixedManagementAction(
  score: number,
  summary: string,
  reason: string,
): ManagementFixedActionRubric {
  return { score, summary, reasons: [reason] };
}

function moveStopManagementAction(
  baseScore: number,
  optimal: readonly [number, number],
  acceptable: readonly [number, number],
  summary: string,
  reason: string,
): ManagementMoveStopRubric {
  return {
    baseScore,
    placementWeight: 0.6,
    protectedRisk: {
      optimal: { min: optimal[0], max: optimal[1] },
      acceptable: { min: acceptable[0], max: acceptable[1] },
    },
    summary,
    reasons: [reason],
  };
}

function buildAlignedManagementRubric(): ExerciseManagementRubric {
  return {
    version: 1,
    checkpoints: [
      {
        afterRevealOffset: 2,
        actions: {
          hold: fixedManagementAction(92, "Mantener respeta una tesis que sigue estructuralmente intacta.", "Todavía no aparece una invalidación suficiente para abandonar la operación."),
          close: fixedManagementAction(40, "Cerrar demasiado pronto renuncia a una tesis que aún conserva estructura.", "El movimiento visible todavía no obliga a salir."),
          move_stop: moveStopManagementAction(66, [0.05, 0.28], [0, 0.42], "Un ajuste pequeño es defendible, pero aún conviene dejar respirar la estructura.", "Proteger demasiado pronto puede convertir ruido normal en una salida innecesaria."),
        },
      },
      {
        afterRevealOffset: 5,
        actions: {
          hold: fixedManagementAction(84, "Mantener sigue siendo coherente mientras la estructura avance a favor.", "La tesis permanece vigente y ya existe desplazamiento favorable."),
          close: fixedManagementAction(68, "Cerrar asegura parte del recorrido, aunque todavía sacrifica una estructura válida.", "La salida es defendible, pero no viene exigida por una invalidación."),
          move_stop: moveStopManagementAction(94, [0.42, 0.82], [0.22, 1.02], "Reducir riesgo ahora acompaña el avance sin ahogar la operación.", "Tras suficiente recorrido, la protección puede acercarse de forma disciplinada."),
        },
      },
      {
        afterRevealOffset: 8,
        actions: {
          hold: fixedManagementAction(76, "Mantener conserva exposición a una estructura todavía favorable.", "La tesis sigue viva, aunque ya existe beneficio suficiente para revisar protección."),
          close: fixedManagementAction(82, "Cerrar es defendible después de un tramo amplio a favor.", "La operación ya ha recorrido una parte relevante del movimiento disponible."),
          move_stop: moveStopManagementAction(96, [0.82, 1.22], [0.58, 1.42], "Proteger cerca de break-even o beneficio bloqueado equilibra continuidad y control de riesgo.", "El recorrido permite reducir prácticamente todo el riesgo inicial sin perseguir cada vela."),
        },
      },
    ],
  };
}

function buildOpposedManagementRubric(): ExerciseManagementRubric {
  return {
    version: 1,
    checkpoints: [
      {
        afterRevealOffset: 2,
        actions: {
          hold: fixedManagementAction(32, "Mantener prolonga una tesis que empieza a perder respaldo.", "Las primeras velas no mejoran la estructura de la operación."),
          close: fixedManagementAction(92, "Cerrar reconoce pronto que la tesis no está siendo confirmada.", "La información disponible favorece preservar riesgo antes que insistir."),
          move_stop: moveStopManagementAction(72, [0.22, 0.58], [0.08, 0.78], "Reducir riesgo es razonable si decides mantener una idea debilitada.", "La protección debe acercarse sin quedar dentro del ruido inmediato."),
        },
      },
      {
        afterRevealOffset: 5,
        actions: {
          hold: fixedManagementAction(22, "Mantener sin cambios deja demasiado margen a una tesis deteriorada.", "La estructura visible continúa restando argumentos a la operación."),
          close: fixedManagementAction(96, "Cerrar es la gestión más disciplinada cuando la tesis no recupera estructura.", "Ya existe evidencia suficiente para dejar de defender la lectura inicial."),
          move_stop: moveStopManagementAction(68, [0.52, 0.9], [0.32, 1.05], "Ajustar el stop limita daño, aunque cerrar sigue siendo más coherente.", "Si mantienes, la protección debería haber avanzado respecto al riesgo inicial."),
        },
      },
      {
        afterRevealOffset: 8,
        actions: {
          hold: fixedManagementAction(15, "Mantener ignora una invalidación contextual ya prolongada.", "No aparece una recuperación suficiente que justifique seguir dando margen."),
          close: fixedManagementAction(98, "Cerrar evita convertir una lectura débil en una pérdida adicional de disciplina.", "El contexto disponible ya no sostiene razonablemente la operación."),
          move_stop: moveStopManagementAction(64, [0.72, 1.0], [0.52, 1.16], "Proteger agresivamente es mejor que mantener intacto el riesgo, aunque la salida sigue siendo preferible.", "A estas alturas el stop debería haber reducido prácticamente todo el riesgo inicial."),
        },
      },
    ],
  };
}

function buildNeutralManagementRubric(): ExerciseManagementRubric {
  return {
    version: 1,
    checkpoints: [
      {
        afterRevealOffset: 2,
        actions: {
          hold: fixedManagementAction(58, "Mantener es posible, pero el contexto sigue sin ofrecer una ventaja direccional limpia.", "La operación continúa dentro de una estructura de equilibrio."),
          close: fixedManagementAction(86, "Cerrar limita exposición en un contexto que continúa sin asimetría clara.", "La falta de confirmación hace razonable abandonar una idea forzada."),
          move_stop: moveStopManagementAction(70, [0.14, 0.42], [0.04, 0.62], "Reducir algo de riesgo es defendible si decides mantener la operación.", "En equilibrio conviene proteger sin colocar el stop dentro del ruido inmediato."),
        },
      },
      {
        afterRevealOffset: 5,
        actions: {
          hold: fixedManagementAction(50, "Mantener prolonga una exposición que sigue sin confirmación clara.", "El escenario todavía rota sin desarrollar una ventaja direccional estable."),
          close: fixedManagementAction(90, "Cerrar reconoce que la operación no ha ganado una razón suficiente para seguir abierta.", "La ausencia de expansión favorece recuperar opcionalidad."),
          move_stop: moveStopManagementAction(82, [0.42, 0.78], [0.22, 0.96], "Proteger reduce exposición sin exigir una predicción sobre la siguiente rotación.", "La gestión debe responder al equilibrio visible y no a la esperanza de ruptura."),
        },
      },
      {
        afterRevealOffset: 8,
        actions: {
          hold: fixedManagementAction(44, "Mantener sigue apostando por una dirección dentro de un contexto que no la confirma.", "El rango continúa penalizando la exposición direccional prolongada."),
          close: fixedManagementAction(92, "Cerrar mantiene la disciplina ante un escenario que sigue sin resolver ventaja.", "La salida evita convertir tiempo en mercado en una justificación por sí misma."),
          move_stop: moveStopManagementAction(88, [0.72, 1.05], [0.48, 1.22], "Proteger de forma clara es una alternativa sólida si todavía mantienes la posición.", "Tras varias rotaciones, el riesgo inicial ya no debería permanecer intacto."),
        },
      },
    ],
  };
}

function buildFalseBreakoutReversalManagementRubric(): ExerciseManagementRubric {
  return {
    version: 1,
    checkpoints: [
      {
        afterRevealOffset: 2,
        actions: {
          hold: fixedManagementAction(78, "Mantener la reversión es defendible mientras el precio siga rechazando la ruptura.", "La vuelta al rango mantiene viva la lectura de fallo, aunque todavía existe ambigüedad."),
          close: fixedManagementAction(72, "Cerrar pronto es razonable porque la entrada nació en un contexto ambiguo.", "La falsa ruptura todavía puede convertirse en una nueva expansión."),
          move_stop: moveStopManagementAction(72, [0.1, 0.35], [0.02, 0.52], "Una protección moderada encaja con una tesis de reversión todavía joven.", "Conviene reducir riesgo sin reaccionar a cada vela de rechazo."),
        },
      },
      {
        afterRevealOffset: 5,
        actions: {
          hold: fixedManagementAction(82, "Mantener sigue siendo defendible si la reentrada al rango se consolida.", "La estructura visible respalda mejor la reversión que al inicio."),
          close: fixedManagementAction(80, "Cerrar captura una lectura que ya ha recorrido parte de su ventaja.", "La salida es razonable porque el origen del trade seguía siendo una zona de incertidumbre."),
          move_stop: moveStopManagementAction(90, [0.45, 0.82], [0.25, 1.0], "Proteger acompaña la confirmación de la reentrada sin exigir una extensión completa.", "La operación ya dispone de recorrido suficiente para reducir riesgo."),
        },
      },
      {
        afterRevealOffset: 8,
        actions: {
          hold: fixedManagementAction(70, "Mantener conserva exposición a la reversión, aunque el movimiento ya está maduro.", "La tesis sigue viva, pero la relación entre recorrido y riesgo ha cambiado."),
          close: fixedManagementAction(88, "Cerrar es una gestión sólida después de una reversión ya desarrollada.", "El precio ha recorrido suficiente distancia como para priorizar disciplina."),
          move_stop: moveStopManagementAction(94, [0.8, 1.18], [0.55, 1.38], "Proteger beneficio permite mantener opcionalidad con mucho menos riesgo.", "La reentrada confirmada ya permite bloquear una parte importante del avance."),
        },
      },
    ],
  };
}

function buildManagementRubrics(
  archetype: SyntheticExerciseArchetype,
  setupDirection: SetupDirection,
): Record<DirectionalDecision, ExerciseManagementRubric> {
  if (archetype === "range-midpoint" || archetype === "compression") {
    return {
      long: buildNeutralManagementRubric(),
      short: buildNeutralManagementRubric(),
    };
  }

  if (archetype === "false-breakout") {
    const reversalDirection = setupDirection as DirectionalDecision;
    return {
      long:
        reversalDirection === "long"
          ? buildFalseBreakoutReversalManagementRubric()
          : buildOpposedManagementRubric(),
      short:
        reversalDirection === "short"
          ? buildFalseBreakoutReversalManagementRubric()
          : buildOpposedManagementRubric(),
    };
  }

  const preferred = setupDirection as DirectionalDecision;
  return {
    long:
      preferred === "long"
        ? buildAlignedManagementRubric()
        : buildOpposedManagementRubric(),
    short:
      preferred === "short"
        ? buildAlignedManagementRubric()
        : buildOpposedManagementRubric(),
  };
}

function decisionRubric(
  skillScores: ExerciseRubric["decisions"][TrainingDecision]["skillScores"],
  summary: string,
  reasons: readonly string[],
) {
  return { skillScores, summary, reasons };
}

function buildIdeaRubric(
  archetype: SyntheticExerciseArchetype,
  traits: ScenarioTraits,
): ExerciseRubric {
  if (archetype === "range-midpoint") {
    return {
      version: 1,
      decisions: {
        long: decisionRubric(
          { range_reading: 38, context_reading: 44, discipline: 34 },
          "La dirección alcista no está suficientemente respaldada desde una zona de equilibrio.",
          ["El precio sigue rotando dentro del rango.", "La entrada nace lejos de una ventaja clara en los extremos.", "Forzar dirección desde el centro reduce la calidad de la decisión."],
        ),
        short: decisionRubric(
          { range_reading: 38, context_reading: 44, discipline: 34 },
          "La dirección bajista tampoco dispone de una ventaja suficientemente clara desde el equilibrio.",
          ["La estructura sigue alternando impulsos dentro del mismo rango.", "No existe una ruptura confirmada que justifique asumir continuación.", "Esperar conserva opcionalidad y disciplina."],
        ),
        no_trade: decisionRubric(
          { range_reading: 96, context_reading: 94, discipline: 98 },
          "No operar es la lectura más sólida mientras el precio permanezca en una zona de equilibrio sin ventaja.",
          ["El mercado ha mostrado varias rotaciones entre extremos.", "La decisión llega cerca del centro de la estructura.", "Esperar evita pagar riesgo por una dirección que todavía no está confirmada."],
        ),
      },
    };
  }

  if (archetype === "trend-continuation") {
    const preferred = traits.setupDirection as DirectionalDecision;
    const opposite: DirectionalDecision = preferred === "long" ? "short" : "long";
    const decisions = {
      long: decisionRubric(
        { trend_reading: 26, context_reading: 30, discipline: 28 },
        "La decisión va contra la estructura dominante y depende de que el retroceso se convierta en giro.",
        ["La secuencia previa conserva dirección.", "El retroceso no ha reparado todavía la estructura dominante.", "Operar contra tendencia exige una confirmación que aquí no aparece."],
      ),
      short: decisionRubric(
        { trend_reading: 26, context_reading: 30, discipline: 28 },
        "La decisión va contra la estructura dominante y depende de que el retroceso se convierta en giro.",
        ["La secuencia previa conserva dirección.", "El retroceso no ha reparado todavía la estructura dominante.", "Operar contra tendencia exige una confirmación que aquí no aparece."],
      ),
      no_trade: decisionRubric(
        { trend_reading: 64, context_reading: 66, discipline: 78 },
        "Esperar es defendible, aunque la estructura ofrece una lectura direccional más clara que en un contexto neutral.",
        ["La paciencia evita perseguir el precio.", "La estructura dominante sigue siendo visible.", "Existe una opción direccional mejor alineada con el contexto."],
      ),
    } satisfies ExerciseRubric["decisions"];

    decisions[preferred] = decisionRubric(
      { trend_reading: 94, context_reading: 88, discipline: 86 },
      preferred === "long"
        ? "La continuación alcista está mejor justificada tras un retroceso que no ha roto la estructura dominante."
        : "La continuación bajista está mejor justificada tras un rebote que no ha roto la estructura dominante.",
      ["La secuencia principal mantiene máximos y mínimos coherentes con la tendencia.", "El retroceso pierde fuerza antes de reparar la estructura previa.", "La decisión se alinea con el contexto en lugar de reaccionar a una vela aislada."],
    );
    decisions[opposite] = decisionRubric(
      { trend_reading: 26, context_reading: 30, discipline: 28 },
      "La decisión contradice la estructura dominante y exige un giro que todavía no está confirmado.",
      ["La tendencia previa sigue estructuralmente intacta.", "El retroceso por sí solo no confirma cambio de régimen.", "Entrar contra la dirección dominante reduce la calidad de la lectura."],
    );

    return { version: 1, decisions };
  }

  if (archetype === "false-breakout") {
    const reversal = traits.setupDirection as DirectionalDecision;
    const continuation: DirectionalDecision = reversal === "long" ? "short" : "long";
    const decisions = {
      long: decisionRubric(
        { false_breakout: 32, context_reading: 36, discipline: 30 },
        "Perseguir la ruptura después de perder aceptación es una lectura débil.",
        ["El precio ya ha vuelto dentro de la estructura previa.", "La aceptación fuera del rango no ha sido estable.", "Continuar en la dirección de la ruptura exige ignorar información reciente."],
      ),
      short: decisionRubric(
        { false_breakout: 32, context_reading: 36, discipline: 30 },
        "Perseguir la ruptura después de perder aceptación es una lectura débil.",
        ["El precio ya ha vuelto dentro de la estructura previa.", "La aceptación fuera del rango no ha sido estable.", "Continuar en la dirección de la ruptura exige ignorar información reciente."],
      ),
      no_trade: decisionRubric(
        { false_breakout: 94, context_reading: 90, discipline: 96 },
        "Esperar es la opción más robusta después de una ruptura que ha perdido aceptación y vuelve a introducir ambigüedad.",
        ["La ruptura reciente ha fallado en sostenerse.", "La reentrada al rango permite lecturas opuestas a corto plazo.", "No operar evita convertir una reacción violenta en una señal categórica."],
      ),
    } satisfies ExerciseRubric["decisions"];

    decisions[reversal] = decisionRubric(
      { false_breakout: 78, context_reading: 74, discipline: 66 },
      "La reversión es defendible tras la pérdida de aceptación, pero todavía asume que el rechazo continuará.",
      ["La vuelta a la estructura previa favorece una lectura de fallo.", "La ruptura ha perdido continuidad.", "La ambigüedad residual mantiene esta opción por debajo de esperar."],
    );
    decisions[continuation] = decisionRubric(
      { false_breakout: 32, context_reading: 36, discipline: 30 },
      "Seguir la ruptura es débil después de que el mercado haya perdido aceptación fuera del rango.",
      ["La reentrada invalida parte del argumento de continuación.", "La estructura previa vuelve a ser relevante.", "La disciplina favorece no perseguir un movimiento que ya ha fallado."],
    );

    return { version: 1, decisions };
  }

  if (archetype === "breakout-acceptance") {
    const preferred = traits.setupDirection as DirectionalDecision;
    const opposite: DirectionalDecision = preferred === "long" ? "short" : "long";
    const decisions = {
      long: decisionRubric(
        { breakout_reading: 28, context_reading: 34, discipline: 30 },
        "La decisión se coloca contra una ruptura que ya ha empezado a aceptar precio fuera de la estructura previa.",
        ["El nivel roto no ha recuperado todavía su función anterior.", "El retroceso mantiene aceptación al otro lado del límite.", "Ir contra la ruptura exige una invalidación que aún no aparece."],
      ),
      short: decisionRubric(
        { breakout_reading: 28, context_reading: 34, discipline: 30 },
        "La decisión se coloca contra una ruptura que ya ha empezado a aceptar precio fuera de la estructura previa.",
        ["El nivel roto no ha recuperado todavía su función anterior.", "El retroceso mantiene aceptación al otro lado del límite.", "Ir contra la ruptura exige una invalidación que aún no aparece."],
      ),
      no_trade: decisionRubric(
        { breakout_reading: 68, context_reading: 70, discipline: 80 },
        "Esperar sigue siendo defendible, aunque la aceptación posterior a la ruptura ya ofrece una ventaja direccional reconocible.",
        ["No perseguir una expansión inicial mantiene disciplina.", "La ruptura ha conservado el nivel en el retesteo.", "Existe una dirección mejor justificada si decides participar."],
      ),
    } satisfies ExerciseRubric["decisions"];

    decisions[preferred] = decisionRubric(
      { breakout_reading: 96, context_reading: 90, discipline: 86 },
      preferred === "long"
        ? "La ruptura alcista gana calidad porque el precio acepta por encima del nivel y el retesteo no recupera el rango."
        : "La ruptura bajista gana calidad porque el precio acepta por debajo del nivel y el retesteo no recupera el rango.",
      ["La expansión supera una referencia estructural reconocible.", "El retroceso posterior conserva precio al otro lado del nivel roto.", "La continuación se apoya en aceptación, no únicamente en una vela expansiva."],
    );
    decisions[opposite] = decisionRubric(
      { breakout_reading: 28, context_reading: 34, discipline: 30 },
      "Operar contra una ruptura aceptada exige anticipar un fallo que todavía no está confirmado.",
      ["El precio sigue respetando el lado nuevo del nivel.", "La estructura posterior a la ruptura no muestra reentrada suficiente.", "La disciplina penaliza adelantarse a una reversión sin evidencia."],
    );

    return { version: 1, decisions };
  }

  if (archetype === "range-extreme") {
    const preferred = traits.setupDirection as DirectionalDecision;
    const opposite: DirectionalDecision = preferred === "long" ? "short" : "long";
    const decisions = {
      long: decisionRubric(
        { range_reading: 32, context_reading: 36, discipline: 30 },
        "La decisión persigue el extremo del rango después de que el precio haya empezado a rechazar esa zona.",
        ["El mercado sigue mostrando límites repetidos.", "La zona extrema ha frenado el movimiento reciente.", "Perseguir el borde reduce el margen disponible dentro del equilibrio."],
      ),
      short: decisionRubric(
        { range_reading: 32, context_reading: 36, discipline: 30 },
        "La decisión persigue el extremo del rango después de que el precio haya empezado a rechazar esa zona.",
        ["El mercado sigue mostrando límites repetidos.", "La zona extrema ha frenado el movimiento reciente.", "Perseguir el borde reduce el margen disponible dentro del equilibrio."],
      ),
      no_trade: decisionRubric(
        { range_reading: 74, context_reading: 76, discipline: 86 },
        "Esperar es razonable en un rango, aunque el rechazo del extremo ofrece una asimetría mejor que desde el centro.",
        ["La abstención evita anticipar cuánto durará la siguiente rotación.", "El precio ya está reaccionando desde un borde reconocido.", "Existe una opción direccional defendible hacia el interior del rango."],
      ),
    } satisfies ExerciseRubric["decisions"];

    decisions[preferred] = decisionRubric(
      { range_reading: 92, context_reading: 86, discipline: 82 },
      "La reversión hacia el interior del rango está mejor respaldada después de un rechazo claro en uno de sus extremos.",
      ["El límite ha sido respetado en rotaciones previas.", "El último test pierde capacidad de seguir expandiendo fuera del equilibrio.", "La operación busca recorrido hacia el interior en lugar de perseguir el extremo."],
    );
    decisions[opposite] = decisionRubric(
      { range_reading: 32, context_reading: 36, discipline: 30 },
      "Perseguir el extremo es una lectura débil mientras el rango siga siendo la estructura dominante.",
      ["El borde ha rechazado precio de nuevo.", "No existe aceptación suficiente fuera del equilibrio.", "El espacio disponible en la dirección elegida es reducido."],
    );

    return { version: 1, decisions };
  }

  if (archetype === "compression") {
    return {
      version: 1,
      decisions: {
        long: decisionRubric(
          { volatility_reading: 40, context_reading: 44, discipline: 36 },
          "Elegir largo dentro de una compresión todavía no resuelta anticipa una expansión que el gráfico no ha confirmado.",
          ["Los desplazamientos se hacen progresivamente más pequeños.", "La estructura continúa acumulando energía sin dirección confirmada.", "Entrar antes de la resolución convierte una posibilidad en una conclusión."],
        ),
        short: decisionRubric(
          { volatility_reading: 40, context_reading: 44, discipline: 36 },
          "Elegir corto dentro de una compresión todavía no resuelta anticipa una expansión que el gráfico no ha confirmado.",
          ["Los desplazamientos se hacen progresivamente más pequeños.", "La estructura continúa acumulando energía sin dirección confirmada.", "Entrar antes de la resolución convierte una posibilidad en una conclusión."],
        ),
        no_trade: decisionRubric(
          { volatility_reading: 97, context_reading: 92, discipline: 98 },
          "No operar es la decisión más sólida mientras la compresión no revele hacia qué lado consigue expandirse y aceptar precio.",
          ["La volatilidad visible se ha contraído.", "Los extremos convergen sin una ruptura confirmada.", "Esperar permite reaccionar a la resolución en lugar de adivinarla."],
        ),
      },
    };
  }

  if (archetype === "exhaustion-reversal") {
    const reversal = traits.setupDirection as DirectionalDecision;
    const continuation: DirectionalDecision = reversal === "long" ? "short" : "long";
    const clearFailure = traits.variant <= 2;
    const decisions = {
      long: decisionRubric(
        { exhaustion_reading: 30, trend_reading: 34, context_reading: 34, discipline: 28 },
        "Seguir la tendencia después de una extensión deteriorada ignora señales crecientes de agotamiento.",
        ["Los impulsos recientes pierden eficiencia.", "Los retrocesos ocupan una parte mayor del avance.", "La última extensión no mantiene la misma calidad estructural."],
      ),
      short: decisionRubric(
        { exhaustion_reading: 30, trend_reading: 34, context_reading: 34, discipline: 28 },
        "Seguir la tendencia después de una extensión deteriorada ignora señales crecientes de agotamiento.",
        ["Los impulsos recientes pierden eficiencia.", "Los retrocesos ocupan una parte mayor del avance.", "La última extensión no mantiene la misma calidad estructural."],
      ),
      no_trade: decisionRubric(
        clearFailure
          ? { exhaustion_reading: 74, trend_reading: 76, context_reading: 78, discipline: 88 }
          : { exhaustion_reading: 94, trend_reading: 88, context_reading: 92, discipline: 96 },
        clearFailure
          ? "Esperar es defendible, aunque el fallo final ya aporta evidencia suficiente para una reversión estructurada."
          : "No operar es la lectura más robusta cuando la tendencia pierde eficiencia pero el giro todavía no ha confirmado suficiente estructura.",
        clearFailure
          ? ["El agotamiento es visible, pero una reversión siempre exige asumir cambio de régimen.", "La última extensión falla con claridad.", "Esperar reduce exposición, aunque existe una alternativa direccional mejor que seguir tendencia."]
          : ["La tendencia previa todavía pesa en el contexto.", "La pérdida de impulso no equivale por sí sola a una reversión confirmada.", "Esperar evita comprar o vender el primer síntoma de cansancio."],
      ),
    } satisfies ExerciseRubric["decisions"];

    decisions[reversal] = decisionRubric(
      clearFailure
        ? { exhaustion_reading: 92, trend_reading: 84, context_reading: 86, discipline: 80 }
        : { exhaustion_reading: 76, trend_reading: 68, context_reading: 72, discipline: 70 },
      clearFailure
        ? "La reversión está bien respaldada porque la tendencia pierde eficiencia y la última extensión fracasa con rechazo suficiente."
        : "La reversión es defendible por agotamiento, pero todavía anticipa un cambio de régimen que no está completamente confirmado.",
      clearFailure
        ? ["Los impulsos pierden distancia mientras los retrocesos ganan profundidad.", "La extensión final no consigue sostener el nuevo extremo.", "La reacción posterior rompe el ritmo que mantenía la tendencia."]
        : ["La tendencia muestra deterioro progresivo.", "Existe un rechazo final, aunque la estructura de giro aún es incompleta.", "La entrada necesita más prudencia que en un fallo plenamente confirmado."],
    );
    decisions[continuation] = decisionRubric(
      { exhaustion_reading: 30, trend_reading: 34, context_reading: 34, discipline: 28 },
      "Continuar en la dirección previa es débil cuando cada nuevo impulso aporta menos y la última extensión pierde calidad.",
      ["La eficiencia tendencial se deteriora.", "El último extremo no conserva aceptación.", "Insistir en continuación ignora una transición que ya está afectando a la estructura."],
    );

    return { version: 1, decisions };
  }

  const preferred = traits.setupDirection as DirectionalDecision;
  const opposite: DirectionalDecision = preferred === "long" ? "short" : "long";
  const decisions = {
    long: decisionRubric(
      { retest_reading: 28, trend_reading: 34, context_reading: 32, discipline: 30 },
      "La decisión contradice un nivel roto que ya ha sido probado desde el lado nuevo sin recuperar la estructura anterior.",
      ["El precio superó una referencia visible.", "El retroceso volvió hacia el nivel sin recuperar la estructura previa.", "Operar contra el retest exige un fallo que todavía no se ha producido."],
    ),
    short: decisionRubric(
      { retest_reading: 28, trend_reading: 34, context_reading: 32, discipline: 30 },
      "La decisión contradice un nivel roto que ya ha sido probado desde el lado nuevo sin recuperar la estructura anterior.",
      ["El precio superó una referencia visible.", "El retroceso volvió hacia el nivel sin recuperar la estructura previa.", "Operar contra el retest exige un fallo que todavía no se ha producido."],
    ),
    no_trade: decisionRubric(
      { retest_reading: 68, trend_reading: 70, context_reading: 72, discipline: 82 },
      "Esperar conserva disciplina, aunque el retest del nivel ya ofrece una lectura de continuación razonablemente definida.",
      ["No participar evita asumir que el primer retest debe funcionar.", "El nivel sigue sosteniendo el lado nuevo.", "Existe una dirección mejor alineada con la estructura si decides operar."],
    ),
  } satisfies ExerciseRubric["decisions"];

  decisions[preferred] = decisionRubric(
    { retest_reading: 95, trend_reading: 88, context_reading: 86, discipline: 84 },
    preferred === "long"
      ? "El retest alcista está bien construido: el antiguo techo actúa como soporte y el precio vuelve a ganar tracción desde ese nivel."
      : "El retest bajista está bien construido: el antiguo suelo actúa como resistencia y el precio vuelve a perder tracción desde ese nivel.",
    ["La ruptura previa desplazó una referencia estructural.", "El retroceso vuelve al nivel sin recuperar el régimen anterior.", "La reacción posterior confirma que el nivel está funcionando desde el lado nuevo."],
  );
  decisions[opposite] = decisionRubric(
    { retest_reading: 28, trend_reading: 34, context_reading: 32, discipline: 30 },
    "Ir contra un retest válido requiere anticipar que el nivel fallará sin evidencia suficiente.",
    ["La referencia rota sigue sosteniendo precio desde el lado nuevo.", "La estructura de continuación permanece intacta.", "La disciplina favorece no luchar contra una reacción ya confirmada en el nivel."],
  );

  return { version: 1, decisions };
}


function shiftDecisionRubric(
  rubric: ExerciseRubric["decisions"][TrainingDecision],
  delta: number,
  summary: string,
  stageReason: string,
): ExerciseRubric["decisions"][TrainingDecision] {
  const skillScores: Partial<Record<TrainingSkill, number>> = {};

  for (const [skill, score] of Object.entries(rubric.skillScores)) {
    if (typeof score !== "number") {
      continue;
    }

    skillScores[skill as TrainingSkill] = Math.round(clamp(score + delta, 0, 100));
  }

  return {
    skillScores,
    summary,
    reasons: [stageReason, ...rubric.reasons.slice(0, 2)],
  };
}

function getObservedDirectionAfterWait(
  candles: readonly Candle[],
  originalDecisionIndex: number,
  waitCount: number,
): DirectionalDecision | null {
  const originalCandle = candles[originalDecisionIndex];
  const stageCandle = candles[originalDecisionIndex + waitCount];

  if (!originalCandle || !stageCandle) {
    return null;
  }

  const referenceCandles = candles.slice(
    Math.max(0, originalDecisionIndex - 13),
    originalDecisionIndex + 1,
  );
  const atr = Math.max(
    getAverageTrueRange(referenceCandles),
    Math.abs(originalCandle.close) * 0.0015,
  );
  const displacement = stageCandle.close - originalCandle.close;

  if (Math.abs(displacement) < atr * 0.32) {
    return null;
  }

  return displacement > 0 ? "long" : "short";
}

function buildWaitStageIdeaRubric(
  archetype: SyntheticExerciseArchetype,
  traits: ScenarioTraits,
  waitCount: number,
  candles: readonly Candle[],
  originalDecisionIndex: number,
): ExerciseRubric {
  const base = buildIdeaRubric(archetype, traits);

  if (waitCount <= 0) {
    return base;
  }

  const decisions = {
    long: base.decisions.long,
    no_trade: base.decisions.no_trade,
    short: base.decisions.short,
  } satisfies ExerciseRubric["decisions"];
  const waitedLabel = waitCount === 1 ? "1 vela" : `${waitCount} velas`;

  if (archetype === "range-midpoint") {
    decisions.no_trade = shiftDecisionRubric(
      base.decisions.no_trade,
      0,
      `Tras esperar ${waitedLabel}, el precio sigue dentro de una estructura de equilibrio sin una ventaja direccional suficientemente limpia.`,
      "La información añadida no ha convertido la rotación del rango en una ruptura aceptada.",
    );
    return { version: 2, decisions };
  }

  if (archetype === "compression") {
    const observedDirection = getObservedDirectionAfterWait(
      candles,
      originalDecisionIndex,
      waitCount,
    );

    if (!observedDirection) {
      decisions.no_trade = shiftDecisionRubric(
        base.decisions.no_trade,
        -Math.min(waitCount * 2, 5),
        `Tras esperar ${waitedLabel}, la compresión todavía no ofrece una expansión suficientemente definida.`,
        "La vela nueva añade información, pero aún no establece una dirección con aceptación clara.",
      );
      return { version: 2, decisions };
    }

    const opposite: DirectionalDecision =
      observedDirection === "long" ? "short" : "long";
    const directionalBoost = waitCount === 1 ? 20 : waitCount === 2 ? 42 : 54;
    const noTradePenalty = waitCount === 1 ? -3 : waitCount === 2 ? -12 : -25;

    decisions[observedDirection] = shiftDecisionRubric(
      base.decisions[observedDirection],
      directionalBoost,
      waitCount >= 3
        ? `Tras esperar ${waitedLabel}, la compresión ya ha empezado a resolver con una expansión ${observedDirection === "long" ? "alcista" : "bajista"} suficientemente clara para plantear participación.`
        : `Tras esperar ${waitedLabel}, aparece una primera expansión ${observedDirection === "long" ? "alcista" : "bajista"}, aunque todavía conviene exigir algo más de aceptación.`,
      "La decisión utiliza únicamente las velas ya reveladas después de la compresión.",
    );
    decisions[opposite] = shiftDecisionRubric(
      base.decisions[opposite],
      -6,
      `La información añadida no respalda operar contra la expansión ${observedDirection === "long" ? "alcista" : "bajista"} que empieza a aparecer.`,
      "Las velas reveladas después de esperar se desplazan en la dirección contraria a esta decisión.",
    );
    decisions.no_trade = shiftDecisionRubric(
      base.decisions.no_trade,
      noTradePenalty,
      waitCount >= 3
        ? "No operar sigue siendo posible, pero la espera ya ha cumplido su función: ahora existe una resolución direccional visible."
        : "No operar sigue siendo una decisión sólida mientras la expansión recién aparecida no acumule suficiente aceptación.",
      "La calidad de abstenerse disminuye a medida que la compresión deja de ser ambigua.",
    );
    return { version: 2, decisions };
  }

  if (archetype === "false-breakout") {
    const reversal = traits.setupDirection as DirectionalDecision;
    const reversalBoost = waitCount === 1 ? 5 : waitCount === 2 ? 12 : 16;
    const noTradePenalty = waitCount === 1 ? -3 : waitCount === 2 ? -10 : -18;

    decisions[reversal] = shiftDecisionRubric(
      base.decisions[reversal],
      reversalBoost,
      `Tras esperar ${waitedLabel}, el rechazo de la falsa ruptura gana continuidad y hace más defendible la reversión.`,
      "Las nuevas velas añaden confirmación al fallo sin utilizar información posterior al nuevo punto de decisión.",
    );
    decisions.no_trade = shiftDecisionRubric(
      base.decisions.no_trade,
      noTradePenalty,
      waitCount >= 3
        ? "No operar sigue siendo prudente, aunque la confirmación acumulada ya favorece claramente la reversión del fallo."
        : "No operar conserva calidad mientras la reversión todavía está construyendo confirmación.",
      "La abstención pierde ventaja gradualmente cuando el rechazo empieza a sostenerse.",
    );
    return { version: 2, decisions };
  }

  if (archetype === "exhaustion-reversal") {
    const reversal = traits.setupDirection as DirectionalDecision;
    const clearFailure = traits.variant <= 2;

    if (!clearFailure) {
      const reversalBoost = waitCount === 1 ? 4 : waitCount === 2 ? 12 : 18;
      const noTradePenalty = waitCount === 1 ? -4 : waitCount === 2 ? -12 : -20;

      decisions[reversal] = shiftDecisionRubric(
        base.decisions[reversal],
        reversalBoost,
        `Tras esperar ${waitedLabel}, el agotamiento empieza a transformarse en una reversión con más estructura visible.`,
        "La información añadida reduce la necesidad de anticipar el giro antes de que aparezca confirmación.",
      );
      decisions.no_trade = shiftDecisionRubric(
        base.decisions.no_trade,
        noTradePenalty,
        waitCount >= 3
          ? "No operar sigue siendo conservador, pero las velas añadidas ya han reducido gran parte de la ambigüedad inicial."
          : "No operar sigue siendo robusto mientras el giro todavía no complete suficiente estructura.",
        "La abstención pierde parte de su ventaja conforme el cambio de ritmo se vuelve observable.",
      );
      return { version: 2, decisions };
    }
  }

  const preferred = traits.setupDirection as DirectionalDecision;
  const preferredBoost = Math.min(waitCount * 2, 5);
  const noTradePenalty = -Math.min(waitCount * 4, 12);

  decisions[preferred] = shiftDecisionRubric(
    base.decisions[preferred],
    preferredBoost,
    `Tras esperar ${waitedLabel}, la estructura sigue favoreciendo la misma dirección y añade algo más de confirmación.`,
    "La espera no cambia la tesis dominante, aunque sí retrasa el momento de participación.",
  );
  decisions.no_trade = shiftDecisionRubric(
    base.decisions.no_trade,
    noTradePenalty,
    "No operar sigue siendo posible, pero la información añadida mantiene una alternativa direccional mejor respaldada.",
    "La espera aporta confirmación sin invalidar la lectura que ya era visible antes.",
  );

  return { version: 2, decisions };
}

export function createSyntheticDecisionStageExercise(
  exercise: Exercise,
  waitCount: number,
): Exercise | undefined {
  if (!Number.isInteger(waitCount) || waitCount < 0) {
    return undefined;
  }

  if (waitCount === 0) {
    return exercise;
  }

  const generation = exercise.source.generation;

  if (
    generation?.generator !== "procedural" ||
    generation.generatorVersion !== SYNTHETIC_GENERATOR_VERSION
  ) {
    return undefined;
  }

  const decisionIndex = exercise.decisionIndex + waitCount;
  const revealCount = exercise.revealCount - waitCount;

  if (
    revealCount < 8 ||
    decisionIndex >= exercise.candles.length ||
    decisionIndex + revealCount >= exercise.candles.length
  ) {
    return undefined;
  }

  const traits = getScenarioTraits(generation.archetype, generation.seed);
  const visibleCandles = exercise.candles.slice(0, decisionIndex + 1);
  const observedDirection =
    generation.archetype === "compression"
      ? getObservedDirectionAfterWait(
          exercise.candles,
          exercise.decisionIndex,
          waitCount,
        )
      : null;
  const managementRubrics =
    generation.archetype === "compression" && observedDirection
      ? {
          long:
            observedDirection === "long"
              ? buildAlignedManagementRubric()
              : buildOpposedManagementRubric(),
          short:
            observedDirection === "short"
              ? buildAlignedManagementRubric()
              : buildOpposedManagementRubric(),
        }
      : exercise.managementRubrics;

  return {
    ...exercise,
    decisionIndex,
    revealCount,
    rubric: buildWaitStageIdeaRubric(
      generation.archetype,
      traits,
      waitCount,
      exercise.candles,
      exercise.decisionIndex,
    ),
    tradePlanRubrics: buildTradePlanRubrics(
      visibleCandles,
      generation.archetype,
    ),
    managementRubrics,
  };
}

function buildSkills(archetype: SyntheticExerciseArchetype) {
  switch (archetype) {
    case "trend-continuation":
      return [
        { skill: "trend_reading" as const, weight: 0.6 },
        { skill: "context_reading" as const, weight: 0.25 },
        { skill: "discipline" as const, weight: 0.15 },
      ];
    case "range-midpoint":
      return [
        { skill: "range_reading" as const, weight: 0.55 },
        { skill: "context_reading" as const, weight: 0.2 },
        { skill: "discipline" as const, weight: 0.25 },
      ];
    case "false-breakout":
      return [
        { skill: "false_breakout" as const, weight: 0.55 },
        { skill: "context_reading" as const, weight: 0.25 },
        { skill: "discipline" as const, weight: 0.2 },
      ];
    case "breakout-acceptance":
      return [
        { skill: "breakout_reading" as const, weight: 0.55 },
        { skill: "context_reading" as const, weight: 0.25 },
        { skill: "discipline" as const, weight: 0.2 },
      ];
    case "range-extreme":
      return [
        { skill: "range_reading" as const, weight: 0.55 },
        { skill: "context_reading" as const, weight: 0.25 },
        { skill: "discipline" as const, weight: 0.2 },
      ];
    case "compression":
      return [
        { skill: "volatility_reading" as const, weight: 0.55 },
        { skill: "context_reading" as const, weight: 0.25 },
        { skill: "discipline" as const, weight: 0.2 },
      ];
    case "exhaustion-reversal":
      return [
        { skill: "exhaustion_reading" as const, weight: 0.45 },
        { skill: "trend_reading" as const, weight: 0.25 },
        { skill: "context_reading" as const, weight: 0.2 },
        { skill: "discipline" as const, weight: 0.1 },
      ];
    case "level-retest":
      return [
        { skill: "retest_reading" as const, weight: 0.45 },
        { skill: "trend_reading" as const, weight: 0.25 },
        { skill: "context_reading" as const, weight: 0.2 },
        { skill: "discipline" as const, weight: 0.1 },
      ];
  }
}

function getNeutralTitle(seed: number) {
  const code = (seed % 65_536).toString(16).toUpperCase().padStart(4, "0");
  return `Escenario de mercado · ${code}`;
}

function getNeutralPrompt() {
  return "Lee únicamente la estructura disponible y decide qué opción está mejor justificada antes de revelar el siguiente tramo.";
}

export function validateSyntheticExercise(
  exercise: Exercise,
): SyntheticScenarioDiagnostics {
  const issues: string[] = [];
  const visible = exercise.candles.slice(0, exercise.decisionIndex + 1);
  const trueRanges = visible.map((candle) => candle.high - candle.low);
  const visibleHigh = Math.max(...visible.map((candle) => candle.high));
  const visibleLow = Math.min(...visible.map((candle) => candle.low));
  const visibleRange = visibleHigh - visibleLow;
  const averageTrueRange = average(trueRanges);
  const maxTrueRange = Math.max(...trueRanges);

  if (visible.length < 28 || visible.length > 124) {
    issues.push("La ventana visible debe contener entre 28 y 124 velas.");
  }

  if (exercise.revealCount < 8 || exercise.decisionIndex + exercise.revealCount >= exercise.candles.length) {
    issues.push("La ventana de revelado no cabe dentro del escenario.");
  }

  exercise.candles.forEach((candle, index) => {
    if (candle.low <= 0 || candle.high <= candle.low) {
      issues.push(`Vela ${index} con rango de precio inválido.`);
    }

    if (candle.high < Math.max(candle.open, candle.close) || candle.low > Math.min(candle.open, candle.close)) {
      issues.push(`Vela ${index} incumple OHLC.`);
    }

    if (index > 0 && candle.timestamp <= exercise.candles[index - 1].timestamp) {
      issues.push(`Timestamp no creciente en vela ${index}.`);
    }
  });

  if (visibleRange < averageTrueRange * 3.0) {
    issues.push("La estructura visible tiene demasiado poco recorrido respecto al ruido de vela.");
  }

  if (maxTrueRange > averageTrueRange * 4.8) {
    issues.push("Existe una vela desproporcionada respecto a la volatilidad del escenario.");
  }

  return {
    valid: issues.length === 0,
    issues,
    visibleRange,
    averageTrueRange,
    maxTrueRange,
  };
}

function generateV2SyntheticExercise(
  archetype: SyntheticExerciseArchetype,
  seed: number,
): Exercise {
  const blueprint = buildBlueprint(archetype, seed);
  const candles = buildCandlesFromCloses(blueprint, seed);
  const visibleCandles = candles.slice(0, blueprint.decisionIndex + 1);
  const exercise: Exercise = {
    id: createSyntheticExerciseId(archetype, seed, SYNTHETIC_GENERATOR_VERSION),
    version: SYNTHETIC_GENERATOR_VERSION,
    title: getNeutralTitle(seed),
    prompt: getNeutralPrompt(),
    timeframe: blueprint.traits.timeframe,
    source: {
      kind: "synthetic",
      label: "Escenario sintético",
      generation: {
        generator: "procedural",
        generatorVersion: SYNTHETIC_GENERATOR_VERSION,
        archetype,
        seed,
        variant: blueprint.traits.variant,
        setupDirection: blueprint.traits.setupDirection,
      },
    },
    candles,
    decisionIndex: blueprint.decisionIndex,
    revealCount: blueprint.revealCount,
    skills: buildSkills(archetype),
    rubric: buildIdeaRubric(archetype, blueprint.traits),
    tradePlanRubrics: buildTradePlanRubrics(visibleCandles, archetype),
    managementRubrics: buildManagementRubrics(archetype, blueprint.traits.setupDirection),
  };
  const diagnostics = validateSyntheticExercise(exercise);

  if (!diagnostics.valid) {
    throw new Error(
      `Escenario sintético inválido (${exercise.id}): ${diagnostics.issues.join(" ")}`,
    );
  }

  return exercise;
}

// Compatibilidad de reconstrucción para IDs g1 ya persistidos durante el bloque inicial.
function transformPrice(
  value: number,
  templateAnchor: number,
  generatedAnchor: number,
  amplitudeScale: number,
) {
  return generatedAnchor + (value - templateAnchor) * amplitudeScale;
}

function transformZone(
  zone: PriceZone,
  templateAnchor: number,
  generatedAnchor: number,
  amplitudeScale: number,
): PriceZone {
  return {
    min: roundPrice(transformPrice(zone.min, templateAnchor, generatedAnchor, amplitudeScale)),
    max: roundPrice(transformPrice(zone.max, templateAnchor, generatedAnchor, amplitudeScale)),
  };
}

function transformZoneRubric(
  rubric: PriceZoneRubric,
  templateAnchor: number,
  generatedAnchor: number,
  amplitudeScale: number,
): PriceZoneRubric {
  return {
    optimal: transformZone(rubric.optimal, templateAnchor, generatedAnchor, amplitudeScale),
    acceptable: transformZone(rubric.acceptable, templateAnchor, generatedAnchor, amplitudeScale),
  };
}

function transformTradePlanRubric(
  rubric: TradePlanRubric,
  templateAnchor: number,
  generatedAnchor: number,
  amplitudeScale: number,
): TradePlanRubric {
  return {
    entry: transformZoneRubric(rubric.entry, templateAnchor, generatedAnchor, amplitudeScale),
    stop: transformZoneRubric(rubric.stop, templateAnchor, generatedAnchor, amplitudeScale),
    target: transformZoneRubric(rubric.target, templateAnchor, generatedAnchor, amplitudeScale),
    minimumRewardRisk: rubric.minimumRewardRisk,
    idealRewardRisk: rubric.idealRewardRisk,
    weights: { ...rubric.weights },
  };
}

function buildLegacyNoiseSeries(
  length: number,
  decisionIndex: number,
  noiseMagnitude: number,
  random: () => number,
) {
  const noise: number[] = [];
  let smoothNoise = 0;

  for (let index = 0; index < length; index += 1) {
    if (index > decisionIndex) {
      noise.push(0);
      continue;
    }

    smoothNoise = smoothNoise * 0.72 + (random() * 2 - 1) * noiseMagnitude * 0.28;
    const taperStart = Math.max(decisionIndex - 10, 0);
    const taper = index >= taperStart
      ? Math.max((decisionIndex - index) / Math.max(decisionIndex - taperStart, 1), 0)
      : 1;
    noise.push(smoothNoise * taper);
  }

  return noise;
}

function generateLegacyV1SyntheticExercise(
  archetype: SyntheticExerciseArchetype,
  seed: number,
): Exercise {
  const template = getTemplateExercise(archetype);
  const random = createDeterministicRandom(seed, `${archetype}:geometry`);
  const templateAnchor = template.candles[template.decisionIndex].close;
  const generatedAnchor = roundPrice(84 + random() * 44);
  const amplitudeScale = 0.76 + random() * 0.52;
  const candleRandom = createDeterministicRandom(seed, `${template.id}:candles`);
  const visibleCandles = template.candles.slice(0, template.decisionIndex + 1);
  const visibleHigh = Math.max(...visibleCandles.map((candle) => candle.high));
  const visibleLow = Math.min(...visibleCandles.map((candle) => candle.low));
  const visibleRange = Math.max(visibleHigh - visibleLow, 1);
  const noiseMagnitude = visibleRange * (0.012 + candleRandom() * 0.01);
  const noise = buildLegacyNoiseSeries(template.candles.length, template.decisionIndex, noiseMagnitude, candleRandom);
  const volumeScale = 0.78 + candleRandom() * 0.5;
  const timestampShift = (seed % 20_000) * 15 * 60 * 1000;
  const candles: Candle[] = [];

  template.candles.forEach((templateCandle, index) => {
    const candleNoise = noise[index] ?? 0;
    const close = roundPrice(
      transformPrice(templateCandle.close, templateAnchor, generatedAnchor, amplitudeScale) + candleNoise,
    );
    const open = index === 0
      ? roundPrice(transformPrice(templateCandle.open, templateAnchor, generatedAnchor, amplitudeScale) + candleNoise)
      : candles[index - 1].close;
    const templateUpperWick = templateCandle.high - Math.max(templateCandle.open, templateCandle.close);
    const templateLowerWick = Math.min(templateCandle.open, templateCandle.close) - templateCandle.low;
    const wickVariation = index <= template.decisionIndex ? 0.82 + candleRandom() * 0.36 : 1;

    candles.push({
      timestamp: templateCandle.timestamp + timestampShift,
      open,
      high: roundPrice(Math.max(open, close) + templateUpperWick * amplitudeScale * wickVariation),
      low: roundPrice(Math.min(open, close) - templateLowerWick * amplitudeScale * wickVariation),
      close,
      volume: typeof templateCandle.volume === "number"
        ? Math.round(templateCandle.volume * volumeScale * (index <= template.decisionIndex ? 0.9 + candleRandom() * 0.2 : 1))
        : undefined,
    });
  });

  const tradePlanRubrics = Object.fromEntries(
    (["long", "short"] as const).map((decision) => [
      decision,
      transformTradePlanRubric(
        template.tradePlanRubrics[decision],
        templateAnchor,
        generatedAnchor,
        amplitudeScale,
      ),
    ]),
  ) as Record<DirectionalDecision, TradePlanRubric>;

  return {
    ...template,
    id: createSyntheticExerciseId(archetype, seed, 1),
    version: 1,
    source: {
      kind: "synthetic",
      label: "Escenario sintético",
      generation: {
        generator: "procedural",
        generatorVersion: 1,
        archetype,
        seed,
      },
    },
    candles,
    tradePlanRubrics,
  };
}

export function generateSyntheticExercise(
  archetype: SyntheticExerciseArchetype,
  seed: number,
): Exercise {
  assertSyntheticSeed(seed);
  return generateV2SyntheticExercise(archetype, seed);
}

export function resolveTrainingExercise(
  exerciseId: string,
  exerciseVersion: number,
): Exercise | undefined {
  const curatedExercise = getDemoExercise(exerciseId);

  if (curatedExercise) {
    return curatedExercise.version === exerciseVersion ? curatedExercise : undefined;
  }

  const descriptor = parseSyntheticExerciseId(exerciseId);

  if (!descriptor || descriptor.generatorVersion !== exerciseVersion) {
    return undefined;
  }

  if (descriptor.generatorVersion === 1) {
    return generateLegacyV1SyntheticExercise(descriptor.archetype, descriptor.seed);
  }

  return generateV2SyntheticExercise(descriptor.archetype, descriptor.seed);
}

function countRecentArchetypes(recentExerciseIds: readonly string[]) {
  const counts = new Map<SyntheticExerciseArchetype, number>(
    SYNTHETIC_ARCHETYPES.map((archetype) => [archetype, 0]),
  );

  recentExerciseIds.forEach((exerciseId) => {
    const descriptor = parseSyntheticExerciseId(exerciseId);

    if (!descriptor) {
      return;
    }

    counts.set(descriptor.archetype, (counts.get(descriptor.archetype) ?? 0) + 1);
  });

  return counts;
}

export function selectSyntheticExercise(options: {
  recentExerciseIds?: readonly string[];
  currentExerciseId?: string | null;
  selectionSeed: number;
}): Exercise {
  const recentExerciseIds = (options.recentExerciseIds ?? []).slice(
    0,
    SYNTHETIC_RECENT_EXERCISE_LIMIT,
  );
  const recentSet = new Set(recentExerciseIds);
  const recentStructuralSignatures = getRecentStructuralSignatures(recentExerciseIds);
  const currentDescriptor = options.currentExerciseId
    ? parseSyntheticExerciseId(options.currentExerciseId)
    : null;
  const archetypeCounts = countRecentArchetypes(recentExerciseIds);
  const random = createDeterministicRandom(options.selectionSeed, "synthetic-selector:v2");
  const candidates = SYNTHETIC_ARCHETYPES.filter(
    (archetype) => archetype !== currentDescriptor?.archetype,
  );
  const usableCandidates = candidates.length > 0 ? candidates : [...SYNTHETIC_ARCHETYPES];
  const minimumCount = Math.min(
    ...usableCandidates.map((archetype) => archetypeCounts.get(archetype) ?? 0),
  );
  const leastSeenCandidates = usableCandidates.filter(
    (archetype) => (archetypeCounts.get(archetype) ?? 0) === minimumCount,
  );
  const selectedArchetype = choose(random, leastSeenCandidates);

  let validFallback: Exercise | null = null;

  for (let attempt = 0; attempt < 128; attempt += 1) {
    const seed = 1 + Math.floor(random() * SYNTHETIC_MAX_SEED);
    const exerciseId = createSyntheticExerciseId(selectedArchetype, seed);

    if (exerciseId === options.currentExerciseId || recentSet.has(exerciseId)) {
      continue;
    }

    try {
      const exercise = generateV2SyntheticExercise(selectedArchetype, seed);
      validFallback ??= exercise;

      const structuralSignature = getSyntheticStructuralSignature(
        selectedArchetype,
        seed,
      );

      if (!recentStructuralSignatures.has(structuralSignature)) {
        return exercise;
      }
    } catch {
      // Una seed que no supera los invariantes se descarta y el selector prueba otra.
    }
  }

  if (validFallback) {
    return validFallback;
  }

  throw new Error("No se pudo seleccionar un escenario sintético válido y no repetido.");
}

export function getSyntheticArchetypeCount() {
  return ARCHETYPE_DEFINITIONS.length;
}

export function getCuratedTemplateCount() {
  return DEMO_EXERCISES.length;
}
