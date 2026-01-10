import React from "react";
export default function AdminCard({ children }) {
  return (
    <div style={{ background: "#23272A", borderRadius: 12, boxShadow: "0 1px 4px #0002", padding: 24, marginBottom: 16 }}>
      {children}
    </div>
  );
}
