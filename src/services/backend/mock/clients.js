import { loadDb, saveDb } from "./db";
import { createId } from "../../../utils/id";

export const clients = {
  async list({ workspaceId, query }) {
    const db = await loadDb();
    let list = db.clients.filter((c) => c.workspaceId === workspaceId);
    if (query) {
      const q = String(query).toLowerCase();
      // Predictive-ish search: show startsWith first, then includes.
      list = list
        .map((c) => {
          const name = c.name.toLowerCase();
          const email = String(c.email || "").toLowerCase();
          const starts = name.startsWith(q) || email.startsWith(q);
          const contains = name.includes(q) || email.includes(q);
          const score = starts ? 2 : contains ? 1 : 0;
          return { c, score, name };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return a.name.localeCompare(b.name);
        })
        .map((x) => x.c);

      return list;
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
