import React from "react";
import TopBar from "../admin/TopBar";
export default function CustomerShell({ children }) {
  return (
    <>
      <TopBar customer />
      {children}
    </>
  );
}
