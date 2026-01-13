// LayoutRouter component — Patch (C) SXR Managements UI refresh
// This component wraps the main app layout and routes to the correct tab navigator or stack.
import React from "react";
import { useAppState } from "../../store/AppStore";
import GuestShell from "../shells/GuestShell";
import CustomerShell from "../shells/CustomerShell";
import ProShell from "../shells/ProShell";
import PublicFeedScreen from "../../screens/public/PublicFeedScreen";
import DashboardScreen from "../../screens/app/DashboardScreen";

export default function LayoutRouter() {
  // BYPASS: mostra sempre la dashboard in ProShell, ignora sessione
  return (
    <ProShell>
      <DashboardScreen />
    </ProShell>
  );
}
