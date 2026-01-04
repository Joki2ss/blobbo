import { loadDb } from "./db";

function safeUserLabel(u) {
  if (!u) return "";
  const name = String(u.fullName || "").trim();
  const email = String(u.email || "").trim();
  return name || email || u.id;
}

export const audit = {
  async list({ workspaceId, limit = 100 }) {
    const db = await loadDb();
    const items = Array.isArray(db.audit) ? db.audit : [];

    const filtered = items
      .filter((a) => a.workspaceId === workspaceId)
      .slice(0, Math.max(1, Math.min(500, Number(limit) || 100)));

    return filtered.map((a) => {
      const actor = db.users.find((u) => u.id === a.actorId);
      const target = db.users.find((u) => u.id === a.targetUserId);
      return {
        ...a,
        actorLabel: safeUserLabel(actor),
        targetLabel: safeUserLabel(target),
      };
    });
  },
};
