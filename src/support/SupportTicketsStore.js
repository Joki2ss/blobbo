import { getJson, setJson } from "../services/storage";
import { uuidv4 } from "../utils/uuid";
import { toSupportRole } from "../utils/roles";

const TICKETS_KEY = "sxr_support_tickets_v1";

function defaultStore() {
  return { tickets: [] };
}

export async function loadTicketsStore() {
  const s = await getJson(TICKETS_KEY, null);
  if (!s) return defaultStore();
  return { tickets: Array.isArray(s.tickets) ? s.tickets : [] };
}

export async function saveTicketsStore(next) {
  await setJson(TICKETS_KEY, next);
}

export function newTicket({ createdBy, subject, category }) {
  const now = new Date().toISOString();
  const ticketId = uuidv4();

  return {
    ticketId,
    createdAt: now,
    lastUpdatedAt: now,
    createdByUserId: createdBy.id,
    createdByEmail: String(createdBy.email || "").trim(),
    createdByRole: toSupportRole(createdBy.role),
    subject: String(subject || "").trim(),
    category: category || "Other",
    status: "OPEN",
    consentState: {
      ticketId,
      adminId: createdBy.id,
      scopes: [],
      consentGiven: false,
      timestamp: null,
      consentTextVersion: "1.0",
    },
    messages: [
      {
        messageId: uuidv4(),
        ticketId,
        senderUserId: createdBy.id,
        senderRole: toSupportRole(createdBy.role),
        messageType: "SYSTEM",
        body: "Ticket created (MOCK_DATA)",
        createdAt: now,
      },
    ],
    attachments: [],
    mock: true,
  };
}

export function newMessage({ ticketId, sender, body }) {
  return {
    messageId: uuidv4(),
    ticketId,
    senderUserId: sender.id,
    senderRole: toSupportRole(sender.role),
    messageType: "TEXT",
    body: String(body || "").trim(),
    createdAt: new Date().toISOString(),
  };
}

export function newAttachment({ ticketId, file, addedBy }) {
  const now = new Date().toISOString();
  const name = String(file?.name || "attachment");
  const uri = String(file?.uri || "");
  const mimeType = file?.mimeType ? String(file.mimeType) : null;
  const size = typeof file?.size === "number" ? file.size : null;

  return {
    attachmentId: uuidv4(),
    ticketId,
    name,
    uri,
    mimeType,
    size,
    addedByUserId: addedBy?.id || null,
    createdAt: now,
    mock: true,
  };
}
