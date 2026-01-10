// LayoutRouter component — Patch (C) SXR Managements UI refresh
// This component wraps the main app layout and routes to the correct tab navigator or stack.
import React from "react";
import PublicFeedScreen from "../../screens/public/PublicFeedScreen";

export default function LayoutRouter() {
  // Mostra la schermata principale pubblica come home
  return <PublicFeedScreen />;
}
