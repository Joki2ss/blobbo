import { loadDb, saveDb } from "./db";
import { createId } from "../../../utils/id";
import { sleep } from "../../../utils/sleep";

function ensureIsolation(workspaceId, message) {
  if (message.workspaceId !== workspaceId) {
    throw new Error("Workspace isolation violation");
  }
}

export const chat = {
  async listThreads({ workspaceId }) {
    const db = await loadDb();
    const msgs = db.messages.filter((m) => m.workspaceId === workspaceId);

    const byClient = new Map();
    for (const m of msgs) {
      ensureIsolation(workspaceId, m);
      const existing = byClient.get(m.clientId);
      if (!existing || m.createdAt > existing.lastMessageAt) {
        byClient.set(m.clientId, {
          clientId: m.clientId,
          workspaceId,
          lastMessageAt: m.createdAt,
          lastText: m.text,
          unreadCount: 0,
        });
      }
    }

    // compute unread counts
    for (const m of msgs) {
      if (!m.read && m.senderType === "CLIENT") {
        const t = byClient.get(m.clientId);
        if (t) t.unreadCount += 1;
      }
    }

    return Array.from(byClient.values()).sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
  },

  async listMessages({ workspaceId, clientId }) {
    const db = await loadDb();
    const list = db.messages
      .filter((m) => m.workspaceId === workspaceId && m.clientId === clientId)
      .sort((a, b) => a.createdAt - b.createdAt);
    for (const m of list) ensureIsolation(workspaceId, m);
    return list;
  },

  async sendMessage({ workspaceId, clientId, senderType, senderId, text, simulateReply }) {
    const db = await loadDb();
    const msg = {
      id: createId("m"),
      workspaceId,
      clientId,
      senderType,
      senderId,
      text,
      createdAt: Date.now(),
      read: senderType === "ADMIN", // outgoing admin messages are read by default in mock
    };

    db.messages.push(msg);
    db.activity.unshift({
      id: createId("a"),
      workspaceId,
      clientId,
      type: "message",
      title: senderType === "ADMIN" ? "Admin message" : "Client message",
      detail: text,
      createdAt: msg.createdAt,
    });

    await saveDb(db);

    if (simulateReply) {
      // Simulated client reply in MOCK mode
      await sleep(700);
      const reply = {
        id: createId("m"),
        workspaceId,
        clientId,
        senderType: "CLIENT",
        senderId: `client_${clientId}`,
        text: "Got it — thanks!",
        createdAt: Date.now(),
        read: false,
      };
      const db2 = await loadDb();
      db2.messages.push(reply);
      db2.activity.unshift({
        id: createId("a"),
        workspaceId,
        clientId,
        type: "message",
        title: "Client message",
        detail: reply.text,
        createdAt: reply.createdAt,
      });
      await saveDb(db2);
      return { message: msg, simulatedReply: reply };
    }

    return { message: msg };
  },

  async markThreadRead({ workspaceId, clientId }) {
    const db = await loadDb();
    let changed = false;
    for (const m of db.messages) {
      if (m.workspaceId === workspaceId && m.clientId === clientId && m.senderType === "CLIENT" && !m.read) {
        m.read = true;
        changed = true;
      }
    }
    if (changed) await saveDb(db);
    return { ok: true };
  },
};
