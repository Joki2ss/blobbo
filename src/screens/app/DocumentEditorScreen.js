import React, { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View, Alert } from "react-native";
import { WebView } from "react-native-webview";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";

import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { TextField } from "../../components/TextField";
import { Button } from "../../components/Button";
import { theme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";
import { getSupportRuntimeConfig } from "../../config/supportFlags";
import { getDocumentById, updateDocument } from "../../documents/DocumentsService";
import { exportDocumentDocx, exportDocumentPdf, exportDocumentTableData, exportDocumentTxt } from "../../documents/DocumentExport";
import { addExport, deleteExport, listExportsForDocument } from "../../documents/DocumentExportsStore";
import { isAdminOrBusiness } from "../../utils/roles";

// Note: Exports are user-triggered only.

const FONT_FAMILIES = ["Arial", "Georgia", "Times New Roman", "Verdana", "Courier New"];
const FONT_SIZES = [12, 14, 16, 18, 24, 32];
const COLORS = ["#000000", "#333333", "#d32f2f", "#1976d2", "#388e3c", "#f57c00"];

function sizeToExec(size) {
  // execCommand fontSize expects 1..7
  if (size <= 12) return 2;
  if (size <= 14) return 3;
  if (size <= 16) return 4;
  if (size <= 18) return 5;
  if (size <= 24) return 6;
  return 7;
}

function editorHtml(initialHtml) {
  const safe = String(initialHtml || "<p></p>");
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 12px; }
  #editor { min-height: 60vh; outline: none; }
  img { max-width: 100%; height: auto; display: block; margin: 8px 0; }
  img[data-selected="true"] { outline: 2px solid #1976d2; }
</style>
</head>
<body>
  <div id="editor" contenteditable="true">${safe}</div>
<script>
(function(){
  const editor = document.getElementById('editor');
  let selectedImgId = null;

  function post(msg){
    try { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(msg)); } catch(e) {}
  }

  function clearSelection(){
    const imgs = editor.querySelectorAll('img');
    imgs.forEach(img => img.setAttribute('data-selected','false'));
    selectedImgId = null;
    post({ type: 'IMG_SELECTED', payload: { imageId: null }});
  }

  editor.addEventListener('input', function(){
    post({ type: 'CONTENT', payload: { html: editor.innerHTML }});
  });

  editor.addEventListener('click', function(e){
    const t = e.target;
    if (t && t.tagName === 'IMG') {
      clearSelection();
      const id = t.getAttribute('data-id') || ('img_' + Date.now());
      t.setAttribute('data-id', id);
      t.setAttribute('data-selected','true');
      selectedImgId = id;
      post({ type: 'IMG_SELECTED', payload: { imageId: id }});
      return;
    }
    clearSelection();
  });

  function exec(cmd, value){
    try {
      document.execCommand(cmd, false, value);
      post({ type: 'CONTENT', payload: { html: editor.innerHTML }});
    } catch(e) {}
  }

  function insertImage(dataUrl){
    const id = 'img_' + Date.now();
    exec('insertHTML', '<img data-id="'+id+'" data-selected="false" style="width:100%" src="'+dataUrl+'" />');
  }

  function setImageWidth(percent){
    if (!selectedImgId) return;
    const img = editor.querySelector('img[data-id="'+selectedImgId+'"]');
    if (!img) return;
    img.style.width = percent + '%';
    post({ type: 'CONTENT', payload: { html: editor.innerHTML }});
  }

  function onMessage(data){
    if (!data || !data.type) return;
    if (data.type === 'CMD') return exec(data.cmd, data.value);
    if (data.type === 'SET_HTML') { editor.innerHTML = data.html || '<p></p>'; return; }
    if (data.type === 'INSERT_IMAGE') return insertImage(data.dataUrl);
    if (data.type === 'IMG_WIDTH') return setImageWidth(data.percent);
  }

  document.addEventListener('message', function(e){
    try { onMessage(JSON.parse(e.data)); } catch(err) {}
  });
  window.addEventListener('message', function(e){
    try { onMessage(JSON.parse(e.data)); } catch(err) {}
  });

  // initial push
  post({ type: 'CONTENT', payload: { html: editor.innerHTML }});
})();
</script>
</body>
</html>`;
}

function jsMsg(obj) {
  return `window.postMessage(${JSON.stringify(JSON.stringify(obj))}, '*'); true;`;
}

export function DocumentEditorScreen({ navigation, route }) {
  const { session, backendMode } = useAppState();
  const actions = useAppActions();
  const user = session?.user;
  const cfg = useMemo(() => getSupportRuntimeConfig({ backendMode }), [backendMode]);
  const canUse = isAdminOrBusiness(user?.role);

  const documentId = route?.params?.documentId;
  const webRef = useRef(null);

  const [doc, setDoc] = useState(null);
  const [title, setTitle] = useState("");
  const [html, setHtml] = useState("<p></p>");
  const [selectedImageId, setSelectedImageId] = useState(null);

  const [fontFamilyIdx, setFontFamilyIdx] = useState(0);
  const [fontSizeIdx, setFontSizeIdx] = useState(2);
  const [colorIdx, setColorIdx] = useState(0);
  const [hlIdx, setHlIdx] = useState(1);

  const [exportsList, setExportsList] = useState([]);

  async function refresh() {
    if (!cfg.DOCUMENT_EDITOR_ENABLED) return;
    const d = await actions.safeCall(() => getDocumentById({ backendMode, sessionUser: user, documentId }), { title: "Document" });
    if (d) {
      setDoc(d);
      setTitle(d.title);
      setHtml(d.content || "<p></p>");

      const ex = await actions.safeCall(() => listExportsForDocument(d.documentId), { title: "Exports" });
      if (Array.isArray(ex)) setExportsList(ex);
    }
  }

  useEffect(() => {
    refresh();
  }, [backendMode, user?.id, documentId]);

  function sendCmd(cmd, value) {
    webRef.current?.injectJavaScript(jsMsg({ type: "CMD", cmd, value }));
  }

  async function save() {
    if (!doc) return;
    const next = await actions.safeCall(
      () => updateDocument({ backendMode, sessionUser: user, documentId: doc.documentId, patch: { title, content: html } }),
      { title: "Save" }
    );
    if (next) setDoc(next);
  }

  async function pickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert("Images", "Permission denied.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85, base64: false });
    if (res.canceled) return;
    const asset = res.assets && res.assets[0] ? res.assets[0] : null;
    if (!asset?.uri) return;

    const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
    const ext = (asset.uri.split('.').pop() || 'jpg').toLowerCase();
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    const dataUrl = `data:${mime};base64,${base64}`;

    webRef.current?.injectJavaScript(jsMsg({ type: "INSERT_IMAGE", dataUrl }));
  }

  async function exportPdf() {
    if (!doc) return;
    const uri = await actions.safeCall(() => exportDocumentPdf({ title: title || doc.title, html }), { title: "Export" });
    if (uri) {
      await actions.safeCall(
        () => addExport({ documentId: doc.documentId, title: title || doc.title, uri, mimeType: "application/pdf" }),
        { title: "Export" }
      );
      const ex = await actions.safeCall(() => listExportsForDocument(doc.documentId), { title: "Exports" });
      if (Array.isArray(ex)) setExportsList(ex);
    }
  }

  async function exportTxt() {
    if (!doc) return;
    const uri = await actions.safeCall(() => exportDocumentTxt({ title: title || doc.title, html }), { title: "Export" });
    if (uri) {
      await actions.safeCall(
        () => addExport({ documentId: doc.documentId, title: title || doc.title, uri, mimeType: "text/plain" }),
        { title: "Export" }
      );
      const ex = await actions.safeCall(() => listExportsForDocument(doc.documentId), { title: "Exports" });
      if (Array.isArray(ex)) setExportsList(ex);
    }
  }

  async function removeExport(exportId) {
    if (!doc) return;
    await actions.safeCall(() => deleteExport(exportId), { title: "Exports" });
    const ex = await actions.safeCall(() => listExportsForDocument(doc.documentId), { title: "Exports" });
    if (Array.isArray(ex)) setExportsList(ex);
  }

  async function exportDocx() {
    await actions.safeCall(() => exportDocumentDocx(), { title: "Export" });
  }

  async function exportTables() {
    await actions.safeCall(() => exportDocumentTableData(), { title: "Export" });
  }

  if (!cfg.DOCUMENT_EDITOR_ENABLED) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Document</Text>
          <Text style={styles.muted}>Document editor is disabled in this mode.</Text>
          <Button title="Back" variant="secondary" onPress={() => navigation.goBack()} />
        </ScrollView>
      </Screen>
    );
  }

  if (!canUse) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Document</Text>
          <Text style={styles.muted}>Only admin/business accounts can use the document editor.</Text>
          <Button title="Back" variant="secondary" onPress={() => navigation.goBack()} />
        </ScrollView>
      </Screen>
    );
  }

  if (!doc) return <Screen />;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Editor</Text>
        <Text style={styles.muted}>Read/write • owner-only • {backendMode}</Text>

        <Card style={styles.card}>
          <TextField label="Title" value={title} onChangeText={setTitle} placeholder="Document title" />

          <View style={styles.toolbarRow}>
            <Button title="B" variant="secondary" onPress={() => sendCmd("bold")} />
            <Button title="I" variant="secondary" onPress={() => sendCmd("italic")} />
            <Button title="U" variant="secondary" onPress={() => sendCmd("underline")} />
            <Button title="Undo" variant="secondary" onPress={() => sendCmd("undo")} />
            <Button title="Redo" variant="secondary" onPress={() => sendCmd("redo")} />
          </View>

          <View style={styles.toolbarRow}>
            <Button title="Left" variant="secondary" onPress={() => sendCmd("justifyLeft")} />
            <Button title="Center" variant="secondary" onPress={() => sendCmd("justifyCenter")} />
            <Button title="Right" variant="secondary" onPress={() => sendCmd("justifyRight")} />
            <Button title="Justify" variant="secondary" onPress={() => sendCmd("justifyFull")} />
          </View>

          <View style={styles.toolbarRow}>
            <Button title="• List" variant="secondary" onPress={() => sendCmd("insertUnorderedList")} />
            <Button title="1. List" variant="secondary" onPress={() => sendCmd("insertOrderedList")} />
            <Button title="H1" variant="secondary" onPress={() => sendCmd("formatBlock", "<h1>")} />
            <Button title="H2" variant="secondary" onPress={() => sendCmd("formatBlock", "<h2>")} />
            <Button title="H3" variant="secondary" onPress={() => sendCmd("formatBlock", "<h3>")} />
            <Button title="H4" variant="secondary" onPress={() => sendCmd("formatBlock", "<h4>")} />
          </View>

          <Text style={styles.label}>Font</Text>
          <View style={styles.toolbarRow}>
            {FONT_FAMILIES.map((f, idx) => (
              <Button
                key={f}
                title={f.split(" ")[0]}
                variant={fontFamilyIdx === idx ? "primary" : "secondary"}
                onPress={() => {
                  setFontFamilyIdx(idx);
                  sendCmd("fontName", f);
                }}
              />
            ))}
          </View>

          <Text style={styles.label}>Size</Text>
          <View style={styles.toolbarRow}>
            {FONT_SIZES.map((s, idx) => (
              <Button
                key={String(s)}
                title={String(s)}
                variant={fontSizeIdx === idx ? "primary" : "secondary"}
                onPress={() => {
                  setFontSizeIdx(idx);
                  sendCmd("fontSize", sizeToExec(s));
                }}
              />
            ))}
          </View>

          <Text style={styles.label}>Text color</Text>
          <View style={styles.toolbarRow}>
            {COLORS.map((c, idx) => (
              <Button
                key={c}
                title={idx === 0 ? "Black" : `C${idx + 1}`}
                variant={colorIdx === idx ? "primary" : "secondary"}
                onPress={() => {
                  setColorIdx(idx);
                  sendCmd("foreColor", c);
                }}
              />
            ))}
          </View>

          <Text style={styles.label}>Highlight</Text>
          <View style={styles.toolbarRow}>
            {COLORS.map((c, idx) => (
              <Button
                key={`hl_${c}`}
                title={idx === 0 ? "None" : `H${idx + 1}`}
                variant={hlIdx === idx ? "primary" : "secondary"}
                onPress={() => {
                  setHlIdx(idx);
                  sendCmd("hiliteColor", idx === 0 ? "transparent" : c);
                }}
              />
            ))}
          </View>

          <View style={styles.toolbarRow}>
            <Button title="Image" variant="secondary" onPress={pickImage} />
            <Button title="Table" variant="secondary" onPress={() => Alert.alert("Tables", "Not Implemented") } />
            <Button title="Chart" variant="secondary" onPress={() => Alert.alert("Charts", "Not Implemented") } />
          </View>

          {selectedImageId ? (
            <>
              <Text style={styles.label}>Selected image size</Text>
              <View style={styles.toolbarRow}>
                <Button title="Small" variant="secondary" onPress={() => webRef.current?.injectJavaScript(jsMsg({ type: "IMG_WIDTH", percent: 40 }))} />
                <Button title="Medium" variant="secondary" onPress={() => webRef.current?.injectJavaScript(jsMsg({ type: "IMG_WIDTH", percent: 70 }))} />
                <Button title="Large" variant="secondary" onPress={() => webRef.current?.injectJavaScript(jsMsg({ type: "IMG_WIDTH", percent: 100 }))} />
              </View>
            </>
          ) : null}

          <View style={styles.toolbarRow}>
            <Button title="Save" onPress={save} />
            <Button title="PDF" variant="secondary" onPress={exportPdf} />
            <Button title="TXT" variant="secondary" onPress={exportTxt} />
            <Button title="DOCX" variant="secondary" onPress={exportDocx} />
            <Button title="CSV/XLSX" variant="secondary" onPress={exportTables} />
          </View>
        </Card>

        <Card style={styles.editorCard}>
          <WebView
            ref={webRef}
            originWhitelist={["*"]}
            source={{ html: editorHtml(html) }}
            javaScriptEnabled
            domStorageEnabled
            onMessage={(e) => {
              try {
                const msg = JSON.parse(e.nativeEvent.data);
                if (msg.type === "CONTENT") {
                  setHtml(String(msg.payload?.html || ""));
                }
                if (msg.type === "IMG_SELECTED") {
                  setSelectedImageId(msg.payload?.imageId || null);
                }
              } catch {
                // ignore
              }
            }}
            style={{ height: 520 }}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.label}>Exports (in-app)</Text>
          {exportsList.length === 0 ? (
            <Text style={styles.muted}>No exported files saved yet.</Text>
          ) : (
            exportsList.map((e) => (
              <View key={e.exportId} style={styles.exportRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exportTitle} numberOfLines={1}>{e.title}</Text>
                  <Text style={styles.muted} numberOfLines={1}>{e.mimeType || "file"} • {e.createdAt}</Text>
                </View>
                <Button title="Delete" variant="secondary" onPress={() => removeExport(e.exportId)} />
              </View>
            ))
          )}
        </Card>

        <Button title="Back" variant="secondary" onPress={() => navigation.goBack()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  muted: {
    ...theme.typography.small,
    color: theme.colors.mutedText,
    marginTop: 6,
  },
  card: {
    marginTop: theme.spacing.md,
  },
  editorCard: {
    marginTop: theme.spacing.md,
    padding: 0,
    overflow: "hidden",
  },
  toolbarRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  label: {
    ...theme.typography.small,
    color: theme.colors.mutedText,
    marginTop: theme.spacing.md,
  },
  exportRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  exportTitle: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
});
