export function pickAllowedKeys(obj, allowedKeys) {
  const src = obj && typeof obj === "object" ? obj : {};
  const allow = Array.isArray(allowedKeys) ? allowedKeys : [];
  const out = {};
  for (const k of allow) {
    if (Object.prototype.hasOwnProperty.call(src, k)) out[k] = src[k];
  }
  return out;
}
