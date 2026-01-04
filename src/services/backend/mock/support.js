import { loadDb, saveDb } from "./db";
import { createId } from "../../../utils/id";

export const support = {
  async create({ workspaceId, userId, subject, description, priority }) {
    const db = await loadDb();

    db.supportRequests = Array.isArray(db.supportRequests) ? db.supportRequests : [];
    db.activity = Array.isArray(db.activity) ? db.activity : [];

    const req = {
      id: createId("sr"),
      workspaceId,
      userId,
      subject,
      description,
      priority: priority || "Normal",
      status: "open",
      createdAt: Date.now(),
    };

    db.supportRequests.unshift(req);
    db.activity.unshift({
      id: createId("a"),
      workspaceId,
      clientId: null,
      type: "support",
      title: "Support request created",
      detail: subject,
      createdAt: req.createdAt,
    });

    await saveDb(db);
    return { ok: true, requestId: req.id };
  },
};
