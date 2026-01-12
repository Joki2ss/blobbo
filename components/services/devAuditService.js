import { getJson, setJson } from "./storage";

const KEY = "sxr_dev_audit_v1";
const MAX = 300;

export async function logDevAudit({ actionType, targetId, meta }) {
  const entry = {
    id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    actionType: String(actionType || ""),
    targetId: String(targetId || ""),
    meta: meta && typeof meta === "object" ? meta : null,
    timestamp: Date.now(),
  };

  const list = await getJson(KEY, []);
  const next = Array.isArray(list) ? list : [];
  next.unshift(entry);
  if (next.length > MAX) next.length = MAX;
  await setJson(KEY, next);
  return entry;
}

export async function listDevAudit() {
  const list = await getJson(KEY, []);
  return Array.isArray(list) ? list : [];
}
