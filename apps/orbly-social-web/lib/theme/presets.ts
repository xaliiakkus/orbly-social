export type ThemePresetId =
  | "orbly-dark"
  | "ocean"
  | "sunset"
  | "forest"
  | "rose"
  | "violet"
  | "light";

export type ThemeCssVars = {
  "--color-bg-primary": string;
  "--color-bg-secondary": string;
  "--color-bg-tertiary": string;
  "--color-bg-hover": string;
  "--color-text-primary": string;
  "--color-text-secondary": string;
  "--color-text-tertiary": string;
  "--color-accent": string;
  "--color-accent-hover": string;
  "--color-border": string;
  "--color-border-subtle": string;
  "--color-like": string;
  "--color-repost": string;
  "--color-reply": string;
  "--color-orbit": string;
  colorScheme: "dark" | "light";
};

export type ThemePreset = {
  id: ThemePresetId;
  name: string;
  description: string;
  swatch: string;
  vars: ThemeCssVars;
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
  partial: Partial<ThemeCssVars> & { colorScheme: "dark" | "light" },
): ThemePreset {
  const like = partial["--color-like"] ?? "#f91880";
  const repost = partial["--color-repost"] ?? "#00ba7c";
  return {
    id,
    name,
    description,
    swatch,
    vars: {
      "--color-bg-primary": partial["--color-bg-primary"] ?? "#000000",
      "--color-bg-secondary": partial["--color-bg-secondary"] ?? "#16181c",
      "--color-bg-tertiary": partial["--color-bg-tertiary"] ?? "#1d1f23",
      "--color-bg-hover": partial["--color-bg-hover"] ?? "rgba(231, 233, 234, 0.08)",
      "--color-text-primary": partial["--color-text-primary"] ?? "#e7e9ea",
      "--color-text-secondary": partial["--color-text-secondary"] ?? "#71767b",
      "--color-text-tertiary": partial["--color-text-tertiary"] ?? "#3e4144",
      "--color-accent": accent,
      "--color-accent-hover": hover(accent),
      "--color-border": partial["--color-border"] ?? "#2f3336",
      "--color-border-subtle": partial["--color-border-subtle"] ?? "#16181c",
      "--color-like": like,
      "--color-repost": repost,
      "--color-reply": partial["--color-reply"] ?? accent,
      "--color-orbit": partial["--color-orbit"] ?? "#7856ff",
      colorScheme: partial.colorScheme,
    },
  };
}

export const THEME_PRESETS: ThemePreset[] = [
  preset("orbly-dark", "Orbly Klasik", "Varsayılan koyu tema", "#1d9bf0", "#1d9bf0", {
    colorScheme: "dark",
  }),
  preset("ocean", "Okyanus", "Soğuk mavi tonlar", "#0ea5e9", "#0ea5e9", {
    colorScheme: "dark",
    "--color-bg-primary": "#020617",
    "--color-bg-secondary": "#0f172a",
    "--color-orbit": "#38bdf8",
  }),
  preset("sunset", "Gün batımı", "Sıcak turuncu vurgular", "#f97316", "#f97316", {
    colorScheme: "dark",
    "--color-bg-primary": "#0c0a09",
    "--color-bg-secondary": "#1c1917",
    "--color-orbit": "#fb923c",
  }),
  preset("forest", "Orman", "Yeşil ve doğal tonlar", "#22c55e", "#22c55e", {
    colorScheme: "dark",
    "--color-bg-primary": "#052e16",
    "--color-bg-secondary": "#14532d",
    "--color-orbit": "#4ade80",
  }),
  preset("rose", "Gül", "Pembe ve canlı aksan", "#f43f5e", "#f43f5e", {
    colorScheme: "dark",
    "--color-bg-primary": "#1a0a0f",
    "--color-bg-secondary": "#2a1018",
    "--color-orbit": "#fb7185",
  }),
  preset("violet", "Mor gece", "Mor ve lila vurgu", "#a78bfa", "#8b5cf6", {
    colorScheme: "dark",
    "--color-bg-primary": "#0f0a1a",
    "--color-bg-secondary": "#1a1228",
    "--color-orbit": "#c084fc",
  }),
  preset("light", "Açık", "Gündüz modu", "#1d9bf0", "#1d9bf0", {
    colorScheme: "light",
    "--color-bg-primary": "#ffffff",
    "--color-bg-secondary": "#f7f9f9",
    "--color-bg-tertiary": "#eff3f4",
    "--color-bg-hover": "rgba(15, 20, 25, 0.06)",
    "--color-text-primary": "#0f1419",
    "--color-text-secondary": "#536471",
    "--color-text-tertiary": "#8b98a5",
    "--color-border": "#eff3f4",
    "--color-border-subtle": "#f7f9f9",
  }),
];

export const THEME_PRESET_MAP = Object.fromEntries(
  THEME_PRESETS.map((p) => [p.id, p]),
) as Record<ThemePresetId, ThemePreset>;
