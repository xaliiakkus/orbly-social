import { ORBLY_THEME, type OrblyTheme } from "@orbly/features";

/** Tüm StyleSheet'lerin okuduğu canlı renk paleti */
export const OrblyColors: OrblyTheme = { ...ORBLY_THEME };

export function applyOrblyColors(next: OrblyTheme): void {
  Object.assign(OrblyColors, next);
}
