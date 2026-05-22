import type { ThemeCssVars, ThemePresetId } from "@/lib/theme/presets";
import { THEME_PRESET_MAP } from "@/lib/theme/presets";

function hoverFromAccent(hex: string): string {
  const n = hex.replace("#", "");
  if (n.length !== 6) return hex;
  const r = Math.max(0, parseInt(n.slice(0, 2), 16) - 18);
  const g = Math.max(0, parseInt(n.slice(2, 4), 16) - 18);
  const b = Math.max(0, parseInt(n.slice(4, 6), 16) - 18);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function mergeThemeVars(
  presetId: ThemePresetId,
  accentOverride: string | null,
): ThemeCssVars {
  const base = THEME_PRESET_MAP[presetId]?.vars ?? THEME_PRESET_MAP["orbly-dark"].vars;
  if (!accentOverride?.trim()) return base;
  const accent = accentOverride.trim();
  return {
    ...base,
    "--color-accent": accent,
    "--color-accent-hover": hoverFromAccent(accent),
    "--color-reply": accent,
  };
}

export function applyThemeToDocument(
  presetId: ThemePresetId,
  accentOverride: string | null,
  options?: { reduceMotion?: boolean },
) {
  if (typeof document === "undefined") return;
  const vars = mergeThemeVars(presetId, accentOverride);
  const root = document.documentElement;
  const entries = Object.entries(vars) as [keyof ThemeCssVars, string][];
  for (const [key, value] of entries) {
    if (key === "colorScheme") {
      root.style.colorScheme = value;
    } else {
      root.style.setProperty(key, value);
    }
  }
  root.dataset.theme = presetId;
  root.classList.toggle("reduce-motion", !!options?.reduceMotion);
}
