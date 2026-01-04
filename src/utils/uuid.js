// Lightweight UUID v4 generator (Snack-safe).
// Not cryptographically perfect, but sufficient for unique IDs in MOCK storage.
export function uuidv4() {
  // RFC4122-ish v4
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function maskEmail(value) {
  const s = String(value || "").trim();
  const parts = s.split("@");
  if (parts.length !== 2) return s;
  const [local, domain] = parts;
  const safeLocal = local.length <= 1 ? "*" : `${local[0]}***`;
  return `${safeLocal}@${domain}`;
}
