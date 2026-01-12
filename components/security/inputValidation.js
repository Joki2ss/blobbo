export function clampString(value, { maxLen = 256, trim = true } = {}) {
  let s = value === null || value === undefined ? "" : String(value);
  if (trim) s = s.trim();
  if (s.length > maxLen) s = s.slice(0, maxLen);
  return s;
}

export function normalizeTagList(list, { maxItems = 12, maxLen = 28, keepCase = true } = {}) {
  const src = Array.isArray(list) ? list : [];
  const out = [];
  const seen = new Set();
  for (const t of src) {
    let s = clampString(t, { maxLen, trim: true });
    if (!s) continue;
    if (!keepCase) s = s.toLowerCase();
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
    if (out.length >= maxItems) break;
  }
  return out;
}

export function normalizePinnedRank(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const i = Math.round(n);
  if (i < 1 || i > 500) return null;
  return i;
}
