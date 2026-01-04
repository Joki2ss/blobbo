import { colors } from "./colors";
import { spacing } from "./spacing";
import { typography } from "./typography";
import { radius } from "./radius";
import { shadows } from "./shadows";

export { ThemeProvider, useTheme, useThemeMode } from "./ThemeProvider";
export { lightColors, darkColors } from "./palettes";

export const theme = {
  colors,
  spacing,
  typography,
  radius,
  shadows,
  isDark: false,
};

export { colors, spacing, typography, radius, shadows };
