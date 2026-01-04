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
          lastText: m.status === "SCHEDULED" ? "(Scheduled)" : m.text,
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

    // Promote due scheduled messages to SENT (MOCK local timers via polling).
    const now = Date.now();
    let changed = false;
    for (const m of db.messages) {
      if (m.workspaceId !== workspaceId || m.clientId !== clientId) continue;
      if (m.status === "SCHEDULED" && m.scheduledAt && now >= m.scheduledAt) {
        m.status = "SENT";
        m.deliveredAt = now;
        changed = true;
      }
    }
    if (changed) await saveDb(db);

    const list = db.messages
      .filter((m) => m.workspaceId === workspaceId && m.clientId === clientId)
      .sort((a, b) => a.createdAt - b.createdAt);
    for (const m of list) ensureIsolation(workspaceId, m);
    return list;
  },

  async sendMessage({ workspaceId, clientId, senderType, senderId, text, simulateReply, media, location, scheduledAt }) {
    const db = await loadDb();
    const conversationId = `${workspaceId}:${clientId}`;
    const createdAt = Date.now();

    const isScheduled = typeof scheduledAt === "number" && scheduledAt > createdAt;
    const msg = {
      id: createId("m"),
      messageId: createId("cm"),
      conversationId,
      workspaceId,
      clientId,
      senderType,
      senderRole: senderType,
      senderId,
      senderUserId: senderId,
      text,
      media: Array.isArray(media) ? media.slice(0, 3) : [],
      location: location && typeof location.latitude === "number" && typeof location.longitude === "number"
        ? { latitude: location.latitude, longitude: location.longitude, link: location.link || null }
        : null,
      scheduledAt: isScheduled ? scheduledAt : null,
      status: isScheduled ? "SCHEDULED" : "SENT",
      createdAt,
      deliveredAt: isScheduled ? null : createdAt,
      read: senderType === "ADMIN", // outgoing admin messages are read by default in mock
    };

    db.messages.push(msg);
    db.activity.unshift({
      id: createId("a"),
      workspaceId,
      clientId,
      type: "message",
      title: senderType === "ADMIN" ? (msg.status === "SCHEDULED" ? "Scheduled admin message" : "Admin message") : "Client message",
      detail: msg.status === "SCHEDULED" ? "(Scheduled)" : text,
      createdAt: msg.createdAt,
    });

    await saveDb(db);

    if (simulateReply && msg.status !== "SCHEDULED") {
      // Simulated client reply in MOCK mode
      await sleep(700);
      const reply = {
        id: createId("m"),
        messageId: createId("cm"),
        conversationId,
        workspaceId,
        clientId,
        senderType: "CLIENT",
        senderRole: "CLIENT",
        senderId: `client_${clientId}`,
        senderUserId: `client_${clientId}`,
        text: "Got it — thanks!",
        createdAt: Date.now(),
        deliveredAt: Date.now(),
        status: "SENT",
        media: [],
        location: null,
        scheduledAt: null,
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

  async cancelScheduledMessage({ workspaceId, messageId }) {
    const db = await loadDb();
    const m = db.messages.find((x) => x.workspaceId === workspaceId && (x.messageId === messageId || x.id === messageId));
    if (!m) return { ok: false };
    if (m.status !== "SCHEDULED") return { ok: false };
    m.status = "CANCELED";
    await saveDb(db);
    return { ok: true };
  },

  async updateScheduledMessage({ workspaceId, messageId, patch }) {
    const db = await loadDb();
    const m = db.messages.find((x) => x.workspaceId === workspaceId && (x.messageId === messageId || x.id === messageId));
    if (!m) return { ok: false };
    if (m.status !== "SCHEDULED") return { ok: false };
    if (typeof patch?.text === "string") m.text = patch.text;
    if (Array.isArray(patch?.media)) m.media = patch.media.slice(0, 3);
    if (patch?.location && typeof patch.location.latitude === "number" && typeof patch.location.longitude === "number") {
      m.location = { latitude: patch.location.latitude, longitude: patch.location.longitude, link: patch.location.link || null };
    }
    if (typeof patch?.scheduledAt === "number" && patch.scheduledAt > Date.now()) m.scheduledAt = patch.scheduledAt;
    await saveDb(db);
    return { ok: true };
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
