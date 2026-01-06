import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { LoginScreen } from "../../screens/auth/LoginScreen";
import { RegisterScreen } from "../../screens/auth/RegisterScreen";
import { ForgotPasswordScreen } from "../../screens/auth/ForgotPasswordScreen";
import { BusinessSignupLazyScreen, MapSearchLazyScreen, PublicFeedLazyScreen, PublicStorefrontLazyScreen } from "../../screens/public";
import { FindAProScreen } from "../../screens/FindAProScreen";

const Stack = createNativeStackNavigator();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PublicFeed" component={PublicFeedLazyScreen} />
      <Stack.Screen name="MapSearch" component={MapSearchLazyScreen} />
      <Stack.Screen name="FindAPro" component={FindAProScreen} />
      <Stack.Screen name="PublicStorefront" component={PublicStorefrontLazyScreen} />
      <Stack.Screen name="BusinessSignup" component={BusinessSignupLazyScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
