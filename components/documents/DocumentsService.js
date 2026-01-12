import { getSupportRuntimeConfig } from "../config/supportFlags";
import { forbiddenError, requireDeveloperSession } from "../support/SupportPermissions";
import { hasValidConsent } from "../support/SupportConsent";
import { loadDocumentsStore, newDocument, saveDocumentsStore } from "./DocumentsStore";

function assertEnabled(cfg) {
  if (!cfg.DOCUMENT_EDITOR_ENABLED) throw new Error("Document editor is disabled");
}

function assertOwner(sessionUser, doc) {
  if (!sessionUser?.id) throw new Error("Not signed in");
  if (!doc) throw new Error("Document not found");
  if (doc.ownerUserId !== sessionUser.id) throw forbiddenError();
}

export async function listDocumentsForOwner({ backendMode, sessionUser }) {
  const cfg = getSupportRuntimeConfig({ backendMode });
  assertEnabled(cfg);
  if (!sessionUser?.id) throw new Error("Not signed in");

  const store = await loadDocumentsStore();
  return store.documents
    .filter((d) => d.ownerUserId === sessionUser.id)
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

export async function createDocument({ backendMode, sessionUser, title, docType }) {
  const cfg = getSupportRuntimeConfig({ backendMode });
  assertEnabled(cfg);
  if (!sessionUser?.id) throw new Error("Not signed in");

  const store = await loadDocumentsStore();
  // Local storage fallback (MOCK and optional LIVE).
  const doc = newDocument({ ownerUserId: sessionUser.id, title, mock: backendMode === "MOCK" });
  if (docType) doc.docType = String(docType);
  store.documents = [doc, ...store.documents];
  await saveDocumentsStore(store);
  return doc;
}

export async function getDocumentById({ backendMode, sessionUser, documentId }) {
  const cfg = getSupportRuntimeConfig({ backendMode });
  assertEnabled(cfg);
  if (!sessionUser?.id) throw new Error("Not signed in");

  const store = await loadDocumentsStore();
  const doc = store.documents.find((d) => d.documentId === documentId);
  assertOwner(sessionUser, doc);
  return doc;
}

export async function updateDocument({ backendMode, sessionUser, documentId, patch }) {
  const cfg = getSupportRuntimeConfig({ backendMode });
  assertEnabled(cfg);
  if (!sessionUser?.id) throw new Error("Not signed in");

  const store = await loadDocumentsStore();
  const idx = store.documents.findIndex((d) => d.documentId === documentId);
  if (idx < 0) throw new Error("Document not found");

  const doc = store.documents[idx];
  assertOwner(sessionUser, doc);

  const next = {
    ...doc,
    docType: patch?.docType != null ? String(patch.docType) : doc.docType,
    title: patch?.title != null ? String(patch.title).trim() || doc.title : doc.title,
    content: patch?.content != null ? String(patch.content) : doc.content,
    updatedAt: new Date().toISOString(),
    version: (doc.version || 1) + 1,
  };

  store.documents[idx] = next;
  await saveDocumentsStore(store);
  return next;
}

export async function deleteDocument({ backendMode, sessionUser, documentId }) {
  const cfg = getSupportRuntimeConfig({ backendMode });
  assertEnabled(cfg);
  if (!sessionUser?.id) throw new Error("Not signed in");

  const store = await loadDocumentsStore();
  const doc = store.documents.find((d) => d.documentId === documentId);
  assertOwner(sessionUser, doc);

  store.documents = store.documents.filter((d) => d.documentId !== documentId);
  await saveDocumentsStore(store);
  return true;
}

// Developer: metadata only, requires support consent (scoped).
export async function listDocumentMetadataForDeveloper({ backendMode, sessionUser, ownerUserId }) {
  const cfg = getSupportRuntimeConfig({ backendMode });
  if (!cfg.SUPPORT_ENABLED || !cfg.DEVELOPER_MODE) throw new Error("Support is disabled");
  await requireDeveloperSession(sessionUser);

  const ok = await hasValidConsent(ownerUserId, "TECH_LOGS");
  if (!ok) return [];

  const store = await loadDocumentsStore();
  return store.documents
    .filter((d) => d.ownerUserId === ownerUserId)
    .map((d) => ({
      documentId: d.documentId,
      ownerUserId: d.ownerUserId,
      docType: d.docType,
      title: d.title,
      updatedAt: d.updatedAt,
      version: d.version,
    }));
}
