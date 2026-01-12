import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

function stripHtml(html) {
  return String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function exportDocumentPdf({ title, html }) {
  const safeTitle = String(title || "document").replace(/[^a-z0-9\-_ ]/gi, "").trim() || "document";
  const wrapped = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/></head><body>${html}</body></html>`;
  const res = await Print.printToFileAsync({ html: wrapped, base64: false });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(res.uri, { mimeType: "application/pdf", dialogTitle: `Export ${safeTitle}.pdf` });
  }
  return res.uri;
}

export async function exportDocumentTxt({ title, html }) {
  const safeTitle = String(title || "document").replace(/[^a-z0-9\-_ ]/gi, "").trim() || "document";
  const text = stripHtml(html);
  const uri = `${FileSystem.cacheDirectory}${safeTitle}.txt`;
  await FileSystem.writeAsStringAsync(uri, text, { encoding: FileSystem.EncodingType.UTF8 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: "text/plain", dialogTitle: `Export ${safeTitle}.txt` });
  }
  return uri;
}

export async function exportDocumentDocx() {
  throw new Error("Not Implemented");
}

export async function exportDocumentTableData() {
  throw new Error("Not Implemented");
}
