import React from "react";
import MinimalLayout from "../components/MinimalLayout";
import GDPRConsent from "../components/GDPRConsent";

export default function SettingsScreen() {
  return (
    <MinimalLayout title="Settings">
      <GDPRConsent />
    </MinimalLayout>
  );
}
