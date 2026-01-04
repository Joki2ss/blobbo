import React from "react";

import { useAppState } from "../../store/AppStore";
import { getSupportRuntimeConfig } from "../../config/supportFlags";
import { logSupportEvent } from "../SupportLogger";
import { SupportErrorBoundaryInner } from "./SupportErrorBoundary";
import { useTheme } from "../../theme";

export function SupportErrorBoundary({ children }) {
  const { backendMode, session, currentScreen } = useAppState();
  const cfg = getSupportRuntimeConfig({ backendMode });
  const user = session?.user;
  const theme = useTheme();

  return (
    <SupportErrorBoundaryInner
      theme={theme}
      onError={(error, info) => {
        if (!cfg.SUPPORT_ENABLED || !cfg.DEVELOPER_MODE) return;
        logSupportEvent({
          category: "Technical",
          subCategory: "UI_ERROR_BOUNDARY",
          severity: "CRITICAL",
          message: error?.message || "UI crash",
          actorUserId: user?.id,
          actorRole: user?.role,
          payload: {
            currentScreen,
            errorName: error?.name,
            stack: String(error?.stack || "").slice(0, 4000),
            componentStack: String(info?.componentStack || "").slice(0, 4000),
          },
        });
      }}
    >
      {children}
    </SupportErrorBoundaryInner>
  );
}
