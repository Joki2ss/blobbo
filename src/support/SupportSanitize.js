const SENSITIVE_KEYS = [
  "password",
  "pass",
  "token",
  "accessToken",
  "refreshToken",
  "authorization",
  "cookie",
  "set-cookie",
  "apiKey",
  "secret",
];

function maskEmail(value) {
  const s = String(value);
  const parts = s.split("@");
  if (parts.length !== 2) return s;
  const [local, domain] = parts;
  const safeLocal = local.length <= 1 ? "*" : `${local[0]}***`;
  return `${safeLocal}@${domain}`;
}

function maskPhone(value) {
  const s = String(value);
  if (s.length <= 4) return "****";
  return `${"*".repeat(Math.max(0, s.length - 4))}${s.slice(-4)}`;
}

export function sanitizePayload(input) {
  try {
    if (input == null) return input;
    if (typeof input === "string") {
      if (input.includes("@")) return maskEmail(input);
      return input.length > 2000 ? input.slice(0, 2000) : input;
    }
    if (typeof input !== "object") return input;

    const seen = new WeakSet();

    const walk = (obj) => {
      if (obj == null) return obj;
      if (typeof obj === "string") {
        if (obj.includes("@")) return maskEmail(obj);
        if (/\+?\d[\d\s\-()]{7,}/.test(obj)) return maskPhone(obj);
        return obj.length > 2000 ? obj.slice(0, 2000) : obj;
      }
      if (typeof obj !== "object") return obj;
      if (seen.has(obj)) return "[circular]";
      seen.add(obj);

      if (Array.isArray(obj)) return obj.slice(0, 50).map(walk);

      const out = {};
      for (const [k, v] of Object.entries(obj)) {
        const key = String(k);
        const lk = key.toLowerCase();
        if (SENSITIVE_KEYS.some((s) => lk.includes(s.toLowerCase()))) {
          out[key] = "[redacted]";
          continue;
        }
        if (lk.includes("email")) {
          out[key] = v ? maskEmail(String(v)) : v;
          continue;
        }
        if (lk.includes("phone")) {
          out[key] = v ? maskPhone(String(v)) : v;
          continue;
        }
        out[key] = walk(v);
      }
      return out;
    };

    return walk(input);
  } catch {
    return "[unserializable]";
  }
}
