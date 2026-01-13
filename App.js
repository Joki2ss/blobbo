import "./components/store/AppStore";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { AppProviders } from "./components/store/AppStore";
import { useAppState } from "./components/store/AppStore";
import { RootNavigator } from "./components/navigation/RootNavigator";
import { ThemeProvider, useTheme } from "./components/theme";
import { SupportErrorBoundary } from "./components/support/SupportUI/SupportErrorBoundaryWrapper";
import { GlobalUpdateGate } from "./components/components/GlobalUpdateGate";

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
