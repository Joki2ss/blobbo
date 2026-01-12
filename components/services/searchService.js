function norm(s) {
  return String(s || "").trim();
}

function normLower(s) {
  return norm(s).toLowerCase();
}

function uniquePush(out, seen, value, max) {
  const v = norm(value);
  if (!v) return;
  const k = v.toLowerCase();
  if (seen.has(k)) return;
  seen.add(k);
  out.push(v);
  if (typeof max === "number" && out.length >= max) return;
}

export function createInMemoryCache({ maxEntries = 20, ttlMs = 30_000 } = {}) {
  const map = new Map();

  function get(key) {
    const hit = map.get(key);
    if (!hit) return null;
    if (Date.now() - hit.at > ttlMs) {
      map.delete(key);
      return null;
    }
    return hit.value;
  }

  function set(key, value) {
    map.set(key, { at: Date.now(), value });
    if (map.size <= maxEntries) return;
    const firstKey = map.keys().next().value;
    if (firstKey) map.delete(firstKey);
  }

  return { get, set };
}

export function rankProfiles({ query, profiles }) {
  const q = normLower(query);
  const list = Array.isArray(profiles) ? profiles : [];
  if (!q) return list;

  function score(p) {
    const hay = [
      p.businessName,
      p.category,
      p.city,
      p.region,
      Array.isArray(p.tags) ? p.tags.join(" ") : "",
      Array.isArray(p.services) ? p.services.join(" ") : "",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (!hay.includes(q)) return 0;

    let s = 1;
    if (normLower(p.businessName).startsWith(q)) s += 20;
    if (normLower(p.category).startsWith(q)) s += 10;
    if (normLower(p.city).startsWith(q)) s += 8;
    if (Array.isArray(p.tags) && p.tags.some((t) => normLower(t).startsWith(q))) s += 6;
    if (Array.isArray(p.services) && p.services.some((t) => normLower(t).startsWith(q))) s += 6;
    return s;
  }

  return list
    .map((p) => ({ p, s: score(p) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.p);
}

export function buildSuggestions({ query, profiles, limit = 8 }) {
  const q = normLower(query);
  const list = Array.isArray(profiles) ? profiles : [];
  const out = [];
  const seen = new Set();

  for (const p of list) {
    if (out.length >= limit) break;

    const fields = [
      p.businessName,
      p.category,
      p.city,
      p.region,
      ...(Array.isArray(p.tags) ? p.tags : []),
      ...(Array.isArray(p.services) ? p.services : []),
    ];

    for (const f of fields) {
      if (out.length >= limit) break;
      const text = norm(f);
      if (!text) continue;
      if (q && !text.toLowerCase().includes(q)) continue;
      uniquePush(out, seen, text, limit);
    }
  }

  return out;
}

export function createStaleRequestGuard() {
  let current = 0;
  return {
    next() {
      current += 1;
      return current;
    },
    isCurrent(token) {
      return token === current;
    },
  };
}
