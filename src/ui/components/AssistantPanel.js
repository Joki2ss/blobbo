import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Keyboard, Animated, Platform, Image, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../../../components/theme";

const DESKTOP_WIDTH = 420;
const MAX_ATTACHMENT_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "application/pdf", "text/plain"];

export default function AssistantPanel({ open, onClose, messages, onSend, onAttach, uploading, userId }) {
  const theme = useTheme ? useTheme() : {};
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState([]);
  const inputRef = useRef();
  const panelAnim = useRef(new Animated.Value(open ? 0 : DESKTOP_WIDTH)).current;

  useEffect(() => {
    Animated.timing(panelAnim, {
      toValue: open ? 0 : DESKTOP_WIDTH,
      duration: 220,
      useNativeDriver: false,
    }).start();
    if (open) inputRef.current && inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    const escListener = (e) => {
      if (e.key === "Escape" && open) onClose && onClose();
    };
    if (Platform.OS === "web") {
      window.addEventListener("keydown", escListener);
      return () => window.removeEventListener("keydown", escListener);
    }
  }, [open, onClose]);

  const handleSend = () => {
    if (!input.trim() && attachments.length === 0) return;
    onSend && onSend({ text: input, attachments });
    setInput("");
    setAttachments([]);
  };

  const handleAttach = async () => {
    let result = await DocumentPicker.getDocumentAsync({
      type: ALLOWED_TYPES.join(","),
      copyToCacheDirectory: true,
      multiple: true,
    });
    if (!result.canceled && result.assets) {
      const valid = result.assets.filter(f => f.size <= MAX_ATTACHMENT_SIZE && ALLOWED_TYPES.includes(f.mimeType));
      setAttachments([...attachments, ...valid.map(f => ({
        id: f.uri,
        type: f.mimeType.startsWith("image/") ? "image" : "file",
        uri: f.uri,
        name: f.name,
        size: f.size,
        mime: f.mimeType,
      }))]);
    }
  };

  const handleImagePick = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled && result.assets) {
      const valid = result.assets.filter(f => f.fileSize <= MAX_ATTACHMENT_SIZE && ALLOWED_TYPES.includes(f.mimeType));
      setAttachments([...attachments, ...valid.map(f => ({
        id: f.uri,
        type: "image",
        uri: f.uri,
        name: f.fileName || "image.jpg",
        size: f.fileSize,
        mime: f.mimeType,
      }))]);
    }
  };

  const removeAttachment = (id) => setAttachments(attachments.filter(a => a.id !== id));

  return (
    <Animated.View style={[styles.panel, { right: panelAnim, backgroundColor: theme.bgCard || "#fff", shadowColor: theme.shadow || "#000" }, open ? styles.open : styles.closed]} pointerEvents={open ? "auto" : "none"}>
      <View style={styles.header}>
        <Text style={styles.title}>Assistant</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close assistant">
          <Ionicons name="close-outline" size={28} color="#23272A" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        style={styles.messages}
        contentContainerStyle={{ padding: 18, paddingBottom: 12 }}
        renderItem={({ item }) => (
          <View style={[styles.message, item.role === "assistant" ? styles.assistantMsg : styles.userMsg]}>
            <Text style={styles.msgText}>{item.text}</Text>
            {item.attachments && item.attachments.length > 0 && (
              <View style={styles.attachments}>
                {item.attachments.map(att => att.type === "image" ? (
                  <Image key={att.id} source={{ uri: att.uri }} style={styles.attachmentImg} />
                ) : (
                  <View key={att.id} style={styles.attachmentFile}><Ionicons name="document-outline" size={18} color="#64748B" /><Text style={styles.attachmentName}>{att.name}</Text></View>
                ))}
              </View>
            )}
          </View>
        )}
      />
      <View style={styles.composerWrap}>
        <View style={styles.attachPreviewRow}>
          {attachments.map(att => (
            <View key={att.id} style={styles.attachPreview}>
              {att.type === "image" ? <Image source={{ uri: att.uri }} style={styles.attachPreviewImg} /> : <Ionicons name="document-outline" size={18} color="#64748B" />}
              <Text style={styles.attachPreviewName} numberOfLines={1}>{att.name}</Text>
              <TouchableOpacity onPress={() => removeAttachment(att.id)} style={styles.attachRemove}><Ionicons name="close" size={14} color="#DC2626" /></TouchableOpacity>
            </View>
          ))}
        </View>
        <View style={styles.composerRow}>
          <TouchableOpacity onPress={handleAttach} style={styles.attachBtn} accessibilityLabel="Attach file">
            <Ionicons name="paperclip-outline" size={22} color="#64748B" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleImagePick} style={styles.attachBtn} accessibilityLabel="Attach image">
            <Ionicons name="image-outline" size={22} color="#64748B" />
          </TouchableOpacity>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Type a message..."
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            multiline
            accessibilityLabel="Chat message input"
          />
          <TouchableOpacity onPress={handleSend} style={styles.sendBtn} accessibilityLabel="Send message">
            <Ionicons name="send" size={22} color={input.trim() || attachments.length ? "#2563EB" : "#B6C0D1"} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: DESKTOP_WIDTH,
    zIndex: 100,
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.13,
    shadowRadius: 12,
    elevation: 8,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    overflow: "hidden",
    borderLeftWidth: 1,
    borderLeftColor: "#E5E7EB",
  },
  open: { right: 0 },
  closed: { right: -DESKTOP_WIDTH },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "#F9FAFB",
  },
  title: { fontWeight: "bold", fontSize: 18, color: "#23272A" },
  closeBtn: { padding: 4, marginLeft: 8 },
  messages: { flex: 1, backgroundColor: "#fff" },
  message: { marginBottom: 18, padding: 12, borderRadius: 10, maxWidth: "90%" },
  assistantMsg: { backgroundColor: "#F3F4F6", alignSelf: "flex-start" },
  userMsg: { backgroundColor: "#2563EB22", alignSelf: "flex-end" },
  msgText: { color: "#23272A", fontSize: 15 },
  attachments: { flexDirection: "row", flexWrap: "wrap", marginTop: 6 },
  attachmentImg: { width: 60, height: 60, borderRadius: 8, marginRight: 8, marginBottom: 4 },
  attachmentFile: { flexDirection: "row", alignItems: "center", backgroundColor: "#F3F4F6", borderRadius: 6, padding: 4, marginRight: 8, marginBottom: 4 },
  attachmentName: { marginLeft: 4, color: "#64748B", fontSize: 13 },
  composerWrap: { padding: 12, borderTopWidth: 1, borderTopColor: "#F3F4F6", backgroundColor: "#F9FAFB" },
  composerRow: { flexDirection: "row", alignItems: "flex-end" },
  attachBtn: { padding: 6, marginRight: 2 },
  input: { flex: 1, minHeight: 36, maxHeight: 90, fontSize: 15, color: "#23272A", backgroundColor: "#fff", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8, borderWidth: 1, borderColor: "#E5E7EB" },
  sendBtn: { padding: 8, marginLeft: 2 },
  attachPreviewRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 4 },
  attachPreview: { flexDirection: "row", alignItems: "center", backgroundColor: "#F3F4F6", borderRadius: 6, padding: 4, marginRight: 8, marginBottom: 4 },
  attachPreviewImg: { width: 28, height: 28, borderRadius: 4, marginRight: 4 },
  attachPreviewName: { maxWidth: 80, color: "#64748B", fontSize: 13 },
  attachRemove: { marginLeft: 4, padding: 2 },
});
