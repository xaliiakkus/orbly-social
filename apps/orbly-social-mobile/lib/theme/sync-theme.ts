import type { OrblyTheme } from "@orbly/features";

import { applyOrblyColors } from "@/lib/orbly-colors-runtime";
import { resolveThemeColors } from "@/lib/theme/resolve";
import type { ThemePresetId } from "@/lib/theme/presets";

export function syncMobileTheme(
  presetId: ThemePresetId,
  accentOverride: string | null,
): OrblyTheme {
  const colors = resolveThemeColors(presetId, accentOverride);
  applyOrblyColors(colors);
  return colors;
}
