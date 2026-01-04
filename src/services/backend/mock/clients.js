import { loadDb, saveDb } from "./db";
import { createId } from "../../../utils/id";

export const clients = {
  async list({ workspaceId, query }) {
    const db = await loadDb();
    let list = db.clients.filter((c) => c.workspaceId === workspaceId);
    if (query) {
      const q = String(query).toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || String(c.email).toLowerCase().includes(q));
    }
    return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  },

  async getById({ workspaceId, clientId }) {
    const db = await loadDb();
    const c = db.clients.find((x) => x.workspaceId === workspaceId && x.id === clientId);
    if (!c) throw new Error("Client not found");
    return c;
  },

  async create({ workspaceId, name, email, phone }) {
    const db = await loadDb();
    const client = {
      id: createId("c"),
      workspaceId,
      name,
      email,
      phone: phone || "",
      status: "active",
      createdAt: Date.now(),
    };
    db.clients.unshift(client);
    await saveDb(db);
    return client;
  },
};
