import "react-native-gesture-handler";
import React from "react";
import { StatusBar } from "expo-status-bar";

import { AppProviders } from "../src/store/AppStore";
import { RootNavigator } from "../src/navigation/RootNavigator";
import { theme } from "../src/theme";
import { SupportErrorBoundary } from "../src/support/SupportUI/SupportErrorBoundaryWrapper";

export default function App() {
  return (
    <AppProviders>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <SupportErrorBoundary>
        <RootNavigator />
      </SupportErrorBoundary>
    </AppProviders>
  );
}
