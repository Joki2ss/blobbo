import React from "react";
export default function AdminTable({ children }) {
  return (
    <div style={{ background: "#23272A", borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
      <table style={{ width: "100%", color: "#fff" }}>{children}</table>
    </div>
  );
}
