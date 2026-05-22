import type { OrblyTheme } from "@orbly/features";

import type { ThemePresetId } from "@/lib/theme/presets";
import { THEME_PRESET_MAP } from "@/lib/theme/presets";

function hoverFromAccent(hex: string): string {
  const n = hex.replace("#", "");
  if (n.length !== 6) return hex;
  const r = Math.max(0, parseInt(n.slice(0, 2), 16) - 18);
  const g = Math.max(0, parseInt(n.slice(2, 4), 16) - 18);
  const b = Math.max(0, parseInt(n.slice(4, 6), 16) - 18);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function resolveThemeColors(
  presetId: ThemePresetId,
  accentOverride: string | null,
): OrblyTheme {
  const base = THEME_PRESET_MAP[presetId]?.colors ?? THEME_PRESET_MAP["orbly-dark"].colors;
  if (!accentOverride?.trim()) return { ...base };
  const accent = accentOverride.trim();
  return {
    ...base,
    accent,
    accentHover: hoverFromAccent(accent),
    reply: accent,
  } as OrblyTheme;
}
