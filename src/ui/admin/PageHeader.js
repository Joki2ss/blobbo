import React from "react";
export default function PageHeader({ title, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottom: "1px solid #eee" }}>
      <h2 style={{ margin: 0 }}>{title}</h2>
      {action}
    </div>
  );
}
