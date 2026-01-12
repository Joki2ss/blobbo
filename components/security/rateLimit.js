const buckets = new Map();

export function allowRate({ key, limit = 10, windowMs = 60_000 }) {
  const now = Date.now();
  const k = String(key || "");
  if (!k) return { ok: true };

  const cur = buckets.get(k) || { start: now, count: 0 };
  if (now - cur.start > windowMs) {
    cur.start = now;
    cur.count = 0;
  }

  cur.count += 1;
  buckets.set(k, cur);

  if (cur.count > limit) {
    return { ok: false, retryAfterMs: Math.max(0, windowMs - (now - cur.start)) };
  }

  return { ok: true };
}
