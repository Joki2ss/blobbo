const MAX_LOGS = 60;

let buffer = [];

export function logEvent(type, details) {
  const entry = {
    id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    type,
    details: safeStringify(details),
    createdAt: Date.now(),
  };

  buffer = [entry, ...buffer].slice(0, MAX_LOGS);
}

export function getRecentLogs() {
  return buffer;
}

function safeStringify(value) {
  try {
    if (value == null) return "";
    if (typeof value === "string") return value;
    return JSON.stringify(value);
  } catch {
    return "";
  }
}
