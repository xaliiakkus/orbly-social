export { OrblyColors } from "@/lib/orbly-colors-runtime";

import { ORBLY_THEME } from "@orbly/features";

const palette = {
  text: ORBLY_THEME.textPrimary,
  background: ORBLY_THEME.bgPrimary,
  tint: ORBLY_THEME.accent,
  tabIconDefault: ORBLY_THEME.textSecondary,
  tabIconSelected: ORBLY_THEME.accent,
};

const Colors = {
  light: palette,
  dark: palette,
};

export default Colors;
