import { getJson, setJson } from "./storage";

const KEY = "sxr_audit_v1";
const MAX = 500;

export const AUDIT_ACTION_TYPES = {
  POST_EDIT: "POST_EDIT",
  POST_HIDE: "POST_HIDE",
  POST_DELETE: "POST_DELETE",
  POST_CREATE: "POST_CREATE",
  POST_REORDER: "POST_REORDER",
  POST_PIN: "POST_PIN",
  POST_UNPIN: "POST_UNPIN",
  BULK_REORDER: "BULK_REORDER",
};

export async function logAudit({ actorUserId, actionType, targetType, targetId, metadata }) {
  const entry = {
    id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    actorUserId: String(actorUserId || ""),
    actionType: String(actionType || ""),
    targetType: String(targetType || ""),
    targetId: String(targetId || ""),
    timestamp: Date.now(),
    metadata: metadata && typeof metadata === "object" ? metadata : null,
  };

  const list = await getJson(KEY, []);
  const next = Array.isArray(list) ? list : [];
  next.unshift(entry);
  if (next.length > MAX) next.length = MAX;
  await setJson(KEY, next);
  return entry;
}

export async function listAudit({ limit = 200 } = {}) {
  const list = await getJson(KEY, []);
  const arr = Array.isArray(list) ? list : [];
  const max = Math.max(1, Math.min(500, Number(limit) || 200));
  return arr.slice(0, max);
}
