import React, { createContext, useContext } from "react";

const theme = {
  colors: {
    background: "#f6f6f7",
    text: "#222",
    textSecondary: "#666",
    primary: "#2d72d9",
    danger: "#d72d2d",
    card: "#fff",
    border: "#e1e1e1",
    input: "#fff",
  },
};

const ThemeContext = createContext(theme);
export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
