export function formatTime(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function formatDateTime(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleString();
  } catch {
    return "";
  }
}
