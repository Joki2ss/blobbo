import { getSupportRuntimeConfig } from "../config/supportFlags";
import { forbiddenError, requireDeveloperSession } from "./SupportPermissions";
import { sanitizePayload } from "./SupportSanitize";
import { logSupportEvent } from "./SupportLogger";
import { loadTicketsStore, newAttachment, newMessage, newTicket, saveTicketsStore } from "./SupportTicketsStore";
import { listAllLogs } from "./SupportService";
import { scopeForCategory } from "./SupportCategories";
import { maskEmail, uuidv4 } from "../utils/uuid";
import { toSupportRole } from "../utils/roles";

const VALID_CATEGORIES = ["Security", "Technical", "Payment", "Other"];
const VALID_STATUS = ["OPEN", "IN_PROGRESS", "CLOSED"];

function normalizeCategory(value) {
  const v = String(value || "Other");
  return VALID_CATEGORIES.includes(v) ? v : "Other";
}

function assertEnabled(cfg) {
  if (!cfg.SUPPORT_TICKETS_ENABLED) throw new Error("Support tickets are disabled");
}

function canSeeTicket(sessionUser, ticket) {
  if (!sessionUser?.id) return false;
  if (sessionUser.role === "DEVELOPER") return true; // not used; developer is via allowlist + session
  return ticket.createdByUserId === sessionUser.id;
}

function presentTicket(ticket, { maskOwnerEmail = false } = {}) {
  if (!ticket) return ticket;
  if (!maskOwnerEmail) return ticket;
  return {
    ...ticket,
    createdByEmail: maskEmail(ticket.createdByEmail),
  };
}

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  const t = d.getTime();
  if (Number.isNaN(t)) return null;
  return t;
}

export async function createSupportTicket({ backendMode, sessionUser, subject, category }) {
  const cfg = getSupportRuntimeConfig({ backendMode });
  assertEnabled(cfg);

  if (!sessionUser?.id) throw new Error("Not signed in");

  if (cfg.BACKEND_MODE !== "MOCK") {
    // LIVE stub
    throw new Error("Not Implemented");
  }

  const store = await loadTicketsStore();
  const ticket = newTicket({
    createdBy: sessionUser,
    subject,
    category: normalizeCategory(category),
  });

  store.tickets = [ticket, ...store.tickets];
  await saveTicketsStore(store);

  await logSupportEvent({
    category: "Technical",
    subCategory: "SUPPORT_TICKET_CREATED",
    severity: "INFO",
    message: "Support ticket created",
    actorUserId: sessionUser.id,
    actorRole: sessionUser.role,
    payload: sanitizePayload({ ticketId: ticket.ticketId, category: ticket.category }),
  });

  return ticket;
}

export async function listTicketsForUser({ backendMode, sessionUser }) {
  const cfg = getSupportRuntimeConfig({ backendMode });
  assertEnabled(cfg);

  if (!sessionUser?.id) throw new Error("Not signed in");

  if (cfg.BACKEND_MODE !== "MOCK") {
    throw new Error("Not Implemented");
  }

  const store = await loadTicketsStore();
  return store.tickets
    .filter((t) => canSeeTicket(sessionUser, t))
    .sort((a, b) => String(b.lastUpdatedAt).localeCompare(String(a.lastUpdatedAt)));
}

export async function listAllTicketsForDeveloper({ backendMode, sessionUser, filters = {} }) {
  const cfg = getSupportRuntimeConfig({ backendMode });
  assertEnabled(cfg);
  await requireDeveloperSession(sessionUser);

  if (cfg.BACKEND_MODE !== "MOCK") {
    throw new Error("Not Implemented");
  }

  const store = await loadTicketsStore();
  let list = [...store.tickets];

  const q = String(filters.query || "").trim().toLowerCase();
  if (q) {
    list = list.filter((t) => {
      const hay = [t.ticketId, t.subject, t.category, t.status, t.createdByUserId, t.createdByRole, t.createdByEmail].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }

  if (filters.status && filters.status !== "All") {
    list = list.filter((t) => t.status === filters.status);
  }

  if (filters.userId) {
    list = list.filter((t) => t.createdByUserId === filters.userId);
  }

  if (filters.role) {
    const want = toSupportRole(filters.role);
    list = list.filter((t) => toSupportRole(t.createdByRole) === want);
  }

  const afterTs = parseDate(filters.createdAfter);
  if (afterTs) {
    list = list.filter((t) => parseDate(t.createdAt) >= afterTs);
  }

  const beforeTs = parseDate(filters.createdBefore);
  if (beforeTs) {
    list = list.filter((t) => parseDate(t.createdAt) <= beforeTs);
  }

  return list
    .sort((a, b) => String(b.lastUpdatedAt).localeCompare(String(a.lastUpdatedAt)))
    .map((t) => presentTicket(t, { maskOwnerEmail: true }));
}

export async function getTicketById({ backendMode, sessionUser, ticketId }) {
  const cfg = getSupportRuntimeConfig({ backendMode });
  assertEnabled(cfg);

  if (!sessionUser?.id) throw new Error("Not signed in");

  if (cfg.BACKEND_MODE !== "MOCK") {
    throw new Error("Not Implemented");
  }

  const store = await loadTicketsStore();
  const t = store.tickets.find((x) => x.ticketId === ticketId);
  if (!t) throw new Error("Ticket not found");

  // Developer can access all, non-dev only own.
  if (await isDeveloper(sessionUser)) return presentTicket(t, { maskOwnerEmail: true });
  if (t.createdByUserId !== sessionUser.id) throw forbiddenError();

  return t;
}

async function isDeveloper(user) {
  try {
    await requireDeveloperSession(user);
    return true;
  } catch {
    return false;
  }
}

export async function postSupportMessage({ backendMode, sessionUser, ticketId, body }) {
  const cfg = getSupportRuntimeConfig({ backendMode });
  assertEnabled(cfg);

  if (!sessionUser?.id) throw new Error("Not signed in");
  const text = String(body || "").trim();
  if (!text) throw new Error("Message is required");

  if (cfg.BACKEND_MODE !== "MOCK") {
    throw new Error("Not Implemented");
  }

  const store = await loadTicketsStore();
  const idx = store.tickets.findIndex((t) => t.ticketId === ticketId);
  if (idx < 0) throw new Error("Ticket not found");

  const t = store.tickets[idx];

  // Permission
  const dev = await isDeveloper(sessionUser);
  if (!dev && t.createdByUserId !== sessionUser.id) throw forbiddenError();

  const msg = newMessage({ ticketId, sender: sessionUser, body: text });
  t.messages = Array.isArray(t.messages) ? [...t.messages, msg] : [msg];
  t.lastUpdatedAt = new Date().toISOString();

  // Simple status automation: developer reply => IN_PROGRESS
  if (dev && t.status === "OPEN") t.status = "IN_PROGRESS";

  store.tickets[idx] = t;
  await saveTicketsStore(store);

  await logSupportEvent({
    category: "Technical",
    subCategory: "SUPPORT_TICKET_MESSAGE",
    severity: "INFO",
    message: "Support ticket message posted",
    actorUserId: sessionUser.id,
    actorRole: sessionUser.role,
    targetUserId: t.createdByUserId,
    payload: sanitizePayload({ ticketId, messageId: msg.messageId }),
    correlationId: ticketId,
  });

  return msg;
}

export async function attachFileToTicket({ backendMode, sessionUser, ticketId, file }) {
  const cfg = getSupportRuntimeConfig({ backendMode });
  assertEnabled(cfg);

  if (!sessionUser?.id) throw new Error("Not signed in");
  if (!file?.uri) throw new Error("File is required");

  if (cfg.BACKEND_MODE !== "MOCK") {
    throw new Error("Not Implemented");
  }

  const store = await loadTicketsStore();
  const idx = store.tickets.findIndex((t) => t.ticketId === ticketId);
  if (idx < 0) throw new Error("Ticket not found");

  const t = store.tickets[idx];
  const dev = await isDeveloper(sessionUser);
  if (!dev && t.createdByUserId !== sessionUser.id) throw forbiddenError();

  const att = newAttachment({ ticketId, file, addedBy: sessionUser });
  t.attachments = Array.isArray(t.attachments) ? [...t.attachments, att] : [att];

  const msg = {
    messageId: newMessage({ ticketId, sender: sessionUser, body: `File attached: ${att.name}` }).messageId,
    ticketId,
    senderUserId: sessionUser.id,
    senderRole: toSupportRole(sessionUser.role),
    messageType: "FILE",
    body: String(att.name || "attachment"),
    attachmentId: att.attachmentId,
    createdAt: new Date().toISOString(),
  };

  t.messages = Array.isArray(t.messages) ? [...t.messages, msg] : [msg];
  t.lastUpdatedAt = new Date().toISOString();
  if (dev && t.status === "OPEN") t.status = "IN_PROGRESS";

  store.tickets[idx] = t;
  await saveTicketsStore(store);

  await logSupportEvent({
    category: "Technical",
    subCategory: "SUPPORT_TICKET_ATTACHMENT",
    severity: "INFO",
    message: "Support ticket attachment added",
    actorUserId: sessionUser.id,
    actorRole: sessionUser.role,
    targetUserId: t.createdByUserId,
    correlationId: ticketId,
    payload: sanitizePayload({ ticketId, attachmentId: att.attachmentId, name: att.name, mimeType: att.mimeType, size: att.size }),
  });

  return att;
}

export async function setTicketStatusByDeveloper({ backendMode, sessionUser, ticketId, status }) {
  const cfg = getSupportRuntimeConfig({ backendMode });
  assertEnabled(cfg);
  await requireDeveloperSession(sessionUser);

  const nextStatus = String(status || "").trim().toUpperCase();
  if (!VALID_STATUS.includes(nextStatus)) throw new Error("Invalid status");

  if (cfg.BACKEND_MODE !== "MOCK") {
    throw new Error("Not Implemented");
  }

  const store = await loadTicketsStore();
  const idx = store.tickets.findIndex((t) => t.ticketId === ticketId);
  if (idx < 0) throw new Error("Ticket not found");

  const t = store.tickets[idx];
  const before = t.status;
  t.status = nextStatus;
  t.lastUpdatedAt = new Date().toISOString();

  t.messages = Array.isArray(t.messages) ? t.messages : [];
  t.messages = [
    ...t.messages,
    {
      messageId: uuidv4(),
      ticketId,
      senderUserId: sessionUser.id,
      senderRole: toSupportRole(sessionUser.role),
      messageType: "SYSTEM",
      body: `Status updated: ${before} → ${nextStatus}`,
      createdAt: new Date().toISOString(),
    },
  ];

  store.tickets[idx] = t;
  await saveTicketsStore(store);

  await logSupportEvent({
    category: "Technical",
    subCategory: "SUPPORT_TICKET_STATUS",
    severity: "INFO",
    message: "Support ticket status updated",
    actorUserId: sessionUser.id,
    actorRole: sessionUser.role,
    targetUserId: t.createdByUserId,
    correlationId: ticketId,
    payload: sanitizePayload({ ticketId, before, after: nextStatus }),
  });

  return presentTicket(t, { maskOwnerEmail: true });
}

export async function setTicketConsent({ backendMode, sessionUser, ticketId, consentGiven, scopes }) {
  const cfg = getSupportRuntimeConfig({ backendMode });
  assertEnabled(cfg);

  if (!sessionUser?.id) throw new Error("Not signed in");

  if (cfg.BACKEND_MODE !== "MOCK") {
    throw new Error("Not Implemented");
  }

  const store = await loadTicketsStore();
  const idx = store.tickets.findIndex((t) => t.ticketId === ticketId);
  if (idx < 0) throw new Error("Ticket not found");

  const t = store.tickets[idx];

  // Only ticket owner can set/revoke consent.
  const dev = await isDeveloper(sessionUser);
  if (!dev && t.createdByUserId !== sessionUser.id) throw forbiddenError();
  if (dev) throw forbiddenError("403 Forbidden");

  const cleanScopes = Array.isArray(scopes) ? scopes.filter(Boolean) : [];

  t.consentState = {
    ...t.consentState,
    consentGiven: !!consentGiven,
    scopes: !!consentGiven ? cleanScopes : [],
    timestamp: new Date().toISOString(),
    consentTextVersion: "1.0",
  };
  t.lastUpdatedAt = new Date().toISOString();

  store.tickets[idx] = t;
  await saveTicketsStore(store);

  await logSupportEvent({
    category: "Security",
    subCategory: "TICKET_CONSENT_UPDATE",
    severity: "INFO",
    message: !!consentGiven ? "Ticket consent granted" : "Ticket consent revoked",
    actorUserId: sessionUser.id,
    actorRole: sessionUser.role,
    payload: sanitizePayload({ ticketId, scopes: t.consentState.scopes }),
  });

  return t.consentState;
}

export async function listRelatedLogsForTicketDeveloper({ backendMode, sessionUser, ticketId }) {
  const cfg = getSupportRuntimeConfig({ backendMode });
  assertEnabled(cfg);
  await requireDeveloperSession(sessionUser);

  if (cfg.BACKEND_MODE !== "MOCK") {
    throw new Error("Not Implemented");
  }

  const store = await loadTicketsStore();
  const t = store.tickets.find((x) => x.ticketId === ticketId);
  if (!t) throw new Error("Ticket not found");

  const consent = t.consentState;
  if (!consent?.consentGiven) return [];
  const allowedScopes = new Set(Array.isArray(consent.scopes) ? consent.scopes : []);
  if (allowedScopes.size === 0) return [];

  const all = await listAllLogs({ backendMode, sessionUser });
  return (all || [])
    .filter((l) => String(l?.payload?.ticketId || "") === String(ticketId))
    .filter((l) => allowedScopes.has(scopeForCategory(l.category)))
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
}
