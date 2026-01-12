import React from "react";
import TopBar from "../admin/TopBar";
import SideBar from "../admin/SideBar";
export default function ProShell({ children }) {
  // Desktop: sidebar + topbar, Mobile: fallback a layout mobile
  return (
    <>
      <TopBar pro />
      <SideBar />
      <div style={{ marginLeft: 240, marginTop: 56 }}>{children}</div>
    </>
  );
}
