/** X.com / Orbly design tokens — web (CSS) ve mobile (StyleSheet) ortak kaynak */
export const ORBLY_THEME = {
  bgPrimary: "#000000",
  bgSecondary: "#16181c",
  bgTertiary: "#1d1f23",
  bgHover: "rgba(255, 255, 255, 0.03)",
  textPrimary: "#e7e9ea",
  textSecondary: "#71767b",
  textTertiary: "#3e4144",
  accent: "#1d9bf0",
  accentHover: "#1a8cd8",
  border: "#2f3336",
  like: "#f91880",
  repost: "#00ba7c",
  reply: "#1d9bf0",
  orbit: "#7856ff",
} as const;

export type OrblyTheme = typeof ORBLY_THEME;
