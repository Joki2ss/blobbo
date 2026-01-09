// LayoutRouter component — Patch (C) SXR Managements UI refresh
// This component wraps the main app layout and routes to the correct tab navigator or stack.
import React from "react";
import { useAppState } from "../store/AppStore";
import { ProTabNavigator } from "../navigation/tabs/ProTabNavigator";
import { CustomerTabNavigator } from "../navigation/tabs/CustomerTabNavigator";
import { isAdminOrBusiness } from "../utils/roles";
import { isDeveloperUser } from "../support/SupportPermissions";

export function LayoutRouter() {
  const { session } = useAppState();
  const user = session?.user;
  const isDev = isDeveloperUser(user);
  const isPro = isDev || isAdminOrBusiness(user?.role);

  // Patch (C): Route to correct tab navigator based on role
  if (isPro) {
    return <ProTabNavigator />;
  }
  return <CustomerTabNavigator />;
}
