// @ts-nocheck
import React, { useEffect, useMemo } from "react";

import { useAppState } from "../../store/AppStore";
import { isAdminOrBusiness } from "../../utils/roles";
import { isDeveloperUser } from "../../support/SupportPermissions";
import { ProOnboardingQuizScreen } from "../ProOnboardingQuizScreen";
import { ProTabNavigator } from "../../navigation/tabs/ProTabNavigator";

function hasOnboarding(user: any) {
  if (!user) return false;
  const cat = String(user.primaryCategory || "").trim();
  const preset = String(user.dashboardPreset || "").trim();
  const modules = Array.isArray(user.enabledModules)
    ? user.enabledModules.filter(Boolean)
    : [];
  return !!cat && !!preset && modules.length > 0;
}

export function ProHomeGateScreen() {
  const { session } = useAppState();
  const user = session?.user;

  const allowed = useMemo(
    () => isDeveloperUser(user) || isAdminOrBusiness(user?.role),
    [user?.role]
  );
  const done = useMemo(
    () => hasOnboarding(user),
    [user?.primaryCategory, user?.dashboardPreset, user?.enabledModules]
  );

  // If not pro, never show this screen (AppStack should not route here), but keep safe.
  if (!allowed) return null;

  if (!done) return <ProOnboardingQuizScreen />;

  return <ProTabNavigator />;
}
