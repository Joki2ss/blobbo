import * as FileSystem from "expo-file-system";

import { getJson, setJson } from "../services/storage";
import { uuidv4 } from "../utils/uuid";

const EXPORTS_KEY = "sxr_document_exports_v1";

function defaultStore() {
  return { exports: [] };
}

export async function loadExportsStore() {
  const s = await getJson(EXPORTS_KEY, null);
  if (!s) return defaultStore();
  return {
    exports: Array.isArray(s.exports) ? s.exports : [],
  };
}

export async function saveExportsStore(next) {
  await setJson(EXPORTS_KEY, next);
}

export async function addExport({ documentId, title, uri, mimeType }) {
  const store = await loadExportsStore();
  const entry = {
    exportId: uuidv4(),
    documentId: String(documentId),
    title: String(title || "document"),
    uri: String(uri),
    mimeType: mimeType ? String(mimeType) : null,
    createdAt: new Date().toISOString(),
  };
  store.exports = [entry, ...store.exports].slice(0, 200);
  await saveExportsStore(store);
  return entry;
}

export async function listExportsForDocument(documentId) {
  const store = await loadExportsStore();
  return store.exports.filter((e) => e.documentId === documentId);
}

export async function deleteExport(exportId) {
  const store = await loadExportsStore();
  const entry = store.exports.find((e) => e.exportId === exportId);
  store.exports = store.exports.filter((e) => e.exportId !== exportId);
  await saveExportsStore(store);

  if (entry?.uri) {
    try {
      await FileSystem.deleteAsync(entry.uri, { idempotent: true });
    } catch {
      // ignore
    }
  }

  return true;
}
