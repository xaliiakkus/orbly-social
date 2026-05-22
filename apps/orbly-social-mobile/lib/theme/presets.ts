import type { OrblyTheme } from "@orbly/features";

/** Preset overrides — OrblyTheme uses literal hex types from ORBLY_THEME. */
export type ThemeColorOverrides = { [K in keyof OrblyTheme]?: string };

export type ThemePresetId =
  | "orbly-dark"
  | "ocean"
  | "sunset"
  | "forest"
  | "rose"
  | "violet"
  | "light";

export type ThemePreset = {
  id: ThemePresetId;
  name: string;
  description: string;
  swatch: string;
  colors: OrblyTheme;
};

function hover(hex: string): string {
  const n = hex.replace("#", "");
  if (n.length !== 6) return hex;
  const r = Math.max(0, parseInt(n.slice(0, 2), 16) - 18);
  const g = Math.max(0, parseInt(n.slice(2, 4), 16) - 18);
  const b = Math.max(0, parseInt(n.slice(4, 6), 16) - 18);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function preset(
  id: ThemePresetId,
  name: string,
  description: string,
  swatch: string,
  accent: string,
  partial: ThemeColorOverrides,
): ThemePreset {
  return {
    id,
    name,
    description,
    swatch,
    colors: {
      bgPrimary: "#000000",
      bgSecondary: "#16181c",
      bgTertiary: "#1d1f23",
      bgHover: "rgba(231, 233, 234, 0.08)",
      textPrimary: "#e7e9ea",
      textSecondary: "#71767b",
      textTertiary: "#3e4144",
      accent,
      accentHover: hover(accent),
      border: "#2f3336",
      like: "#f91880",
      repost: "#00ba7c",
      reply: accent,
      orbit: "#7856ff",
      ...partial,
    } as OrblyTheme,
  };
}

export const THEME_PRESETS: ThemePreset[] = [
  preset("orbly-dark", "Orbly Klasik", "Varsayılan koyu tema", "#1d9bf0", "#1d9bf0", {}),
  preset("ocean", "Okyanus", "Soğuk mavi tonlar", "#0ea5e9", "#0ea5e9", {
    bgPrimary: "#020617",
    bgSecondary: "#0f172a",
    orbit: "#38bdf8",
  }),
  preset("sunset", "Gün batımı", "Sıcak turuncu vurgular", "#f97316", "#f97316", {
    bgPrimary: "#0c0a09",
    bgSecondary: "#1c1917",
    orbit: "#fb923c",
  }),
  preset("forest", "Orman", "Yeşil tonlar", "#22c55e", "#22c55e", {
    bgPrimary: "#052e16",
    bgSecondary: "#14532d",
    orbit: "#4ade80",
  }),
  preset("rose", "Gül", "Pembe vurgu", "#f43f5e", "#f43f5e", {
    bgPrimary: "#1a0a0f",
    bgSecondary: "#2a1018",
    orbit: "#fb7185",
  }),
  preset("violet", "Mor gece", "Mor ve lila", "#8b5cf6", "#8b5cf6", {
    bgPrimary: "#0f0a1a",
    bgSecondary: "#1a1228",
    orbit: "#c084fc",
  }),
  preset("light", "Açık", "Gündüz modu", "#1d9bf0", "#1d9bf0", {
    bgPrimary: "#ffffff",
    bgSecondary: "#f7f9f9",
    bgTertiary: "#eff3f4",
    bgHover: "rgba(15, 20, 25, 0.06)",
    textPrimary: "#0f1419",
    textSecondary: "#536471",
    textTertiary: "#8b98a5",
    border: "#eff3f4",
  }),
];

export const THEME_PRESET_MAP = Object.fromEntries(
  THEME_PRESETS.map((p) => [p.id, p]),
) as Record<ThemePresetId, ThemePreset>;
