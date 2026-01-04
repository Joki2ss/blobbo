function toText(x) {
  try {
    if (x == null) return "";
    if (typeof x === "string") return x;
    return JSON.stringify(x);
  } catch {
    return "";
  }
}

export function searchLogs({ logs, query, category, severity, actorUserId }) {
  const q = String(query || "").trim().toLowerCase();
  const uid = String(actorUserId || "").trim();

  return (logs || []).filter((l) => {
    if (category && category !== "All" && l.category !== category) return false;
    if (severity && severity !== "All" && l.severity !== severity) return false;
    if (uid && l.actorUserId !== uid && l.targetUserId !== uid) return false;

    if (!q) return true;
    const hay = [
      l.category,
      l.subCategory,
      l.severity,
      l.message,
      l.actorUserId,
      l.targetUserId,
      ...(l.tags || []),
      toText(l.payload),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function aggregateCharts(logs) {
  const byCategory = {};
  const bySeverity = {};
  const byDay = {};
  const bySubCategory = {};

  for (const l of logs || []) {
    byCategory[l.category] = (byCategory[l.category] || 0) + 1;
    bySeverity[l.severity] = (bySeverity[l.severity] || 0) + 1;
    bySubCategory[l.subCategory] = (bySubCategory[l.subCategory] || 0) + 1;

    const day = String(l.timestamp || "").slice(0, 10) || "unknown";
    byDay[day] = (byDay[day] || 0) + 1;
  }

  const topSubCategories = Object.entries(bySubCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const days = Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0]));

  return {
    byCategory,
    bySeverity,
    days,
    topSubCategories,
  };
}
