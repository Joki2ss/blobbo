import { loadDb } from "./db";

export const activity = {
  async list({ workspaceId, clientId }) {
    const db = await loadDb();
    let rows = db.activity.filter((a) => a.workspaceId === workspaceId);
    if (clientId) rows = rows.filter((a) => a.clientId === clientId);
    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
};
