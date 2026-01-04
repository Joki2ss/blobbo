import React, { useMemo, useRef } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";

import { theme } from "../theme";

// Lightweight rich text editor for feed post descriptions.
// Uses contentEditable inside WebView (same technique as document editor).

export function FeedRichTextEditor({ valueHtml, onChangeHtml }) {
  const webRef = useRef(null);

  const html = useMemo(() => {
    const safe = typeof valueHtml === "string" ? valueHtml : "";
    return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body { font-family: -apple-system, system-ui, Segoe UI, Roboto, Arial; margin: 0; padding: 12px; }
  #e { min-height: 120px; outline: none; font-size: 15px; }
  a { color: #2563eb; }
  ul { padding-left: 22px; }
</style>
</head>
<body>
<div id="e" contenteditable="true">${safe}</div>
<script>
  const editor = document.getElementById('e');
  function send() {
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'change', html: editor.innerHTML }));
  }
  editor.addEventListener('input', () => { send(); });
  window.__cmd = function(cmd, arg) {
    document.execCommand(cmd, false, arg || null);
    editor.focus();
    send();
  }
</script>
</body>
</html>`;
  }, [valueHtml]);

  function run(cmd, arg) {
    const js = `window.__cmd(${JSON.stringify(cmd)}, ${JSON.stringify(arg || null)}); true;`;
    webRef.current?.injectJavaScript?.(js);
  }

  return (
    <View>
      <View style={styles.toolbar}>
        <IconBtn name="bold" onPress={() => run("bold")} />
        <IconBtn name="italic" onPress={() => run("italic")} />
        <IconBtn name="list" onPress={() => run("insertUnorderedList")} />
        <IconBtn name="link" onPress={() => run("createLink", "https://") } />
      </View>
      <View style={styles.editorWrap}>
        <WebView
          ref={webRef}
          originWhitelist={["*"]}
          source={{ html }}
          style={styles.web}
          onMessage={(e) => {
            try {
              const msg = JSON.parse(e.nativeEvent.data);
              if (msg?.type === "change") onChangeHtml?.(msg.html);
            } catch {}
          }}
        />
      </View>
    </View>
  );
}

function IconBtn({ name, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.iconBtn, pressed ? { opacity: 0.85 } : null]}>
      <Ionicons name={name} size={16} color={theme.colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.chipBg,
    alignItems: "center",
    justifyContent: "center",
  },
  editorWrap: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    overflow: "hidden",
    backgroundColor: theme.colors.surface,
  },
  web: {
    height: 180,
    backgroundColor: theme.colors.surface,
  },
});
