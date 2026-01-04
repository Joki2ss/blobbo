import { loadDb, saveDb } from "./db";
import { createId } from "../../../utils/id";

function computeStatus(items) {
  const done = items.filter((i) => i.done).length;
  if (done === 0) return "pending";
  if (done === items.length) return "completed";
  return "partial";
}

export const documents = {
  async listForClient({ workspaceId, clientId }) {
    const db = await loadDb();
    return db.documents
      .filter((d) => d.workspaceId === workspaceId && d.clientId === clientId)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  async createRequest({ workspaceId, clientId, title, items, templateId }) {
    const db = await loadDb();

    const request = {
      id: createId("dr"),
      workspaceId,
      clientId,
      templateId: templateId || "custom",
      title,
      items: items.map((label, idx) => ({ id: `i_${idx}_${createId("x")}`, label, done: false })),
      status: "pending",
      createdAt: Date.now(),
      uploads: [],
    };

    db.documents.unshift(request);
    db.activity.unshift({
      id: createId("a"),
      workspaceId,
      clientId,
      type: "document_request",
      title: "Document request created",
      detail: title,
      createdAt: request.createdAt,
    });

    await saveDb(db);
    return request;
  },

  async toggleItem({ workspaceId, requestId, itemId }) {
    const db = await loadDb();
    const req = db.documents.find((r) => r.workspaceId === workspaceId && r.id === requestId);
    if (!req) throw new Error("Request not found");

    const item = req.items.find((i) => i.id === itemId);
    if (!item) throw new Error("Item not found");

    item.done = !item.done;
    req.status = computeStatus(req.items);
    await saveDb(db);
    return req;
  },

  async addUploadMetadata({ workspaceId, requestId, name, size, mimeType }) {
    const db = await loadDb();
    const req = db.documents.find((r) => r.workspaceId === workspaceId && r.id === requestId);
    if (!req) throw new Error("Request not found");

    req.uploads = [
      { id: createId("up"), name, size: size || 0, mimeType: mimeType || "", createdAt: Date.now() },
      ...(req.uploads || []),
    ];

    await saveDb(db);
    return req;
  },
};
