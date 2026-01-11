import "react-native-gesture-handler";
import React from "react";
import { StatusBar } from "expo-status-bar";

import { AppProviders } from "../store/AppStore";
import { useAppState } from "../store/AppStore";
import { RootNavigator } from "../navigation/RootNavigator";
import { ThemeProvider, useTheme } from "../theme";
import { SupportErrorBoundary } from "../support/SupportUI/SupportErrorBoundaryWrapper";
import { GlobalUpdateGate } from "../components/GlobalUpdateGate";

function ThemedApp() {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <SupportErrorBoundary>
        <GlobalUpdateGate />
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
