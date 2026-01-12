import React, { useCallback } from "react";
import { NavigationContainer } from "@react-navigation/native";

import { useAppActions, useAppState } from "../store/AppStore";
import { navigationRef, getCurrentRouteName } from "./navRef";
import { AuthStack } from "./stacks/AuthStack";
import { AppStack } from "./stacks/AppStack";

export function RootNavigator() {
  const state = useAppState();
  const actions = useAppActions();

  const onStateChange = useCallback(() => {
    const name = getCurrentRouteName();
    if (name) actions.setCurrentScreen(name);
  }, [actions]);

  if (!state.hydrated) {
    // Keep it minimal: avoid a splash screen dependency.
    return null;
  }

  return (
    <NavigationContainer ref={navigationRef} onStateChange={onStateChange}>
      {state.session ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
