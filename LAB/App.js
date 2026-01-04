import "react-native-gesture-handler";
import React from "react";
import { StatusBar } from "expo-status-bar";

import { AppProviders } from "../src/store/AppStore";
import { useAppState } from "../src/store/AppStore";
import { RootNavigator } from "../src/navigation/RootNavigator";
import { ThemeProvider, useTheme } from "../src/theme";
import { SupportErrorBoundary } from "../src/support/SupportUI/SupportErrorBoundaryWrapper";

function ThemedApp() {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <SupportErrorBoundary>
        <RootNavigator />
      </SupportErrorBoundary>
    </>
  );
}

function ThemeBridge({ children }) {
  const { themeMode } = useAppState();
  return <ThemeProvider mode={themeMode}>{children}</ThemeProvider>;
}

export default function App() {
  return (
    <AppProviders>
      <ThemeBridge>
        <ThemedApp />
      </ThemeBridge>
    </AppProviders>
  );
}
