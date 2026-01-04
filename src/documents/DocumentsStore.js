import { getJson, setJson } from "../services/storage";
import { uuidv4 } from "../utils/uuid";

const STORE_KEY = "sxr_documents_v1";

function defaultStore() {
  return { documents: [] };
}

export async function loadDocumentsStore() {
  const s = await getJson(STORE_KEY, null);
  if (!s) return defaultStore();
  return {
    documents: Array.isArray(s.documents) ? s.documents : [],
  };
}

export async function saveDocumentsStore(next) {
  await setJson(STORE_KEY, next);
}

export function newDocument({ ownerUserId, title, mock = true }) {
  const now = new Date().toISOString();
  return {
    documentId: uuidv4(),
    ownerUserId,
    title: String(title || "Untitled document").trim() || "Untitled document",
    content: "<p></p>",
    createdAt: now,
    updatedAt: now,
    version: 1,
    mock: !!mock,
  };
}
