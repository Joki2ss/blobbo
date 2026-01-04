import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";

import { spacing } from "./spacing";
import { typography } from "./typography";
import { radius } from "./radius";
import { lightColors, darkColors } from "./palettes";

const ThemeContext = createContext(null);

function createShadows(isDark) {
  return {
    card: {
      shadowColor: isDark ? "#000000" : "#0F172A",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.14 : 0.08,
      shadowRadius: 12,
      elevation: isDark ? 2 : 3,
    },
  };
}

function createTheme(isDark) {
  const colors = isDark ? darkColors : lightColors;
  return {
    colors,
    spacing,
    typography,
    radius,
    shadows: createShadows(isDark),
    isDark,
  };
}

export function ThemeProvider({ mode, children }) {
  const system = useColorScheme();
  const resolvedDark = mode === "dark" ? true : mode === "light" ? false : system === "dark";

  const value = useMemo(() => {
    return {
      mode: mode || "system",
      theme: createTheme(!!resolvedDark),
    };
  }, [mode, resolvedDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx?.theme) {
    // Fallback: light theme.
    return createTheme(false);
  }
  return ctx.theme;
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  return ctx?.mode || "system";
}
