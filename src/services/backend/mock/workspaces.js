import { loadDb } from "./db";

export const workspaces = {
  async listForUser({ userId }) {
    const db = await loadDb();
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error("User not found");

    const memberships = Array.isArray(db.memberships) ? db.memberships : [];
    const allowedIds = new Set(
      memberships.filter((m) => m.userId === userId).map((m) => m.workspaceId)
    );

    // Backward compatible fallback (older DBs)
    if (allowedIds.size === 0 && user.workspaceId) allowedIds.add(user.workspaceId);

    return db.workspaces.filter((w) => allowedIds.has(w.id));
  },

  async getById({ workspaceId }) {
    const db = await loadDb();
    const ws = db.workspaces.find((w) => w.id === workspaceId);
    if (!ws) throw new Error("Workspace not found");
    return ws;
  },
};
