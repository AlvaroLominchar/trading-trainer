import "server-only";

export const THEME_PRESETS = [
  "midnight",
  "light",
  "violet",
  "forest",
] as const;

export type ThemePreset =
  (typeof THEME_PRESETS)[number];

export const DEFAULT_THEME_PRESET: ThemePreset =
  "midnight";

function isThemePreset(
  value: string,
): value is ThemePreset {
  return THEME_PRESETS.some(
    (preset) => preset === value,
  );
}

export function getThemePreset(): ThemePreset {
  const configuredTheme =
    process.env.APP_THEME?.trim().toLowerCase();

  if (
    configuredTheme &&
    isThemePreset(configuredTheme)
  ) {
    return configuredTheme;
  }

  return DEFAULT_THEME_PRESET;
}