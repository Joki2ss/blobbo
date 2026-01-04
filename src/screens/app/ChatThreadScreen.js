import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../../components/Screen";
import { TextField } from "../../components/TextField";
import { Button } from "../../components/Button";
import { theme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";
import { isAdminOrBusiness } from "../../utils/roles";
import { formatTime } from "../../utils/date";
import { logEvent } from "../../services/logger";

export function ChatThreadScreen({ navigation, route }) {
  const { workspace, session, backendMode } = useAppState();
  const actions = useAppActions();
  const clientId = route?.params?.clientId;

  const [client, setClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const listRef = useRef(null);

  const canSend = useMemo(() => text.trim().length > 0 && !sending, [text, sending]);

  async function refresh() {
    if (!workspace?.id || !clientId) return;
    const c = await actions.backend.clients.getById({ workspaceId: workspace.id, clientId });
    setClient(c);
    navigation.setOptions({ title: c.name });

    const list = await actions.backend.chat.listMessages({ workspaceId: workspace.id, clientId });
    setMessages(list);

    await actions.backend.chat.markThreadRead({ workspaceId: workspace.id, clientId });
  }

  useEffect(() => {
    actions.safeCall(refresh, { title: "Load failed" });
  }, [workspace?.id, clientId, backendMode]);

  useEffect(() => {
    const t = setInterval(() => {
      actions.safeCall(async () => {
        if (!workspace?.id || !clientId) return;
        const list = await actions.backend.chat.listMessages({ workspaceId: workspace.id, clientId });
        setMessages(list);
      });
    }, 2000);
    return () => clearInterval(t);
  }, [workspace?.id, clientId, backendMode]);

  async function onSend() {
    if (!workspace?.id || !session?.user || !clientId) return;
    const payload = text.trim();
    if (!payload) return;

    setSending(true);
    setText("");
    logEvent("chat_send", { workspaceId: workspace.id, clientId });

    await actions.safeCall(async () => {
      await actions.backend.chat.sendMessage({
        workspaceId: workspace.id,
        clientId,
        senderType: isAdminOrBusiness(session.user.role) ? "ADMIN" : "CLIENT",
        senderId: session.user.id,
        text: payload,
        simulateReply: backendMode === "MOCK" && isAdminOrBusiness(session.user.role),
      });
      await refresh();
      setTimeout(() => {
        try {
          listRef.current?.scrollToEnd?.({ animated: true });
        } catch {}
      }, 50);
    }, { title: "Send failed" });

    setSending(false);
  }

  const data = messages;

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={80}>
        <FlatList
          ref={listRef}
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isMe = item.senderId === session?.user?.id && item.senderType !== "CLIENT";
            const bubbleStyle = isMe ? styles.bubbleMe : styles.bubbleOther;
            const textStyle = isMe ? styles.textMe : styles.textOther;
            return (
              <View style={[styles.row, isMe ? styles.rowMe : styles.rowOther]}>
                <View style={[styles.bubble, bubbleStyle]}>
                  <Text style={[styles.msgText, textStyle]}>{item.text}</Text>
                  <Text style={[styles.time, isMe ? styles.timeMe : styles.timeOther]}>{formatTime(item.createdAt)}</Text>
                </View>
              </View>
            );
          }}
        />

        <View style={styles.composer}>
          <TextField
            value={text}
            onChangeText={setText}
            placeholder="Message"
            right={
              <Ionicons
                name="send"
                size={18}
                color={canSend ? theme.colors.primary : theme.colors.mutedText}
                onPress={canSend ? onSend : undefined}
              />
            }
          />
          <Button title="Send" onPress={onSend} disabled={!canSend} loading={sending} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  row: {
    marginBottom: theme.spacing.md,
    flexDirection: "row",
  },
  rowMe: {
    justifyContent: "flex-end",
  },
  rowOther: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "78%",
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
  },
  bubbleMe: {
    backgroundColor: theme.colors.bubbleMe,
  },
  bubbleOther: {
    backgroundColor: theme.colors.bubbleOther,
  },
  msgText: {
    ...theme.typography.body,
  },
  textMe: {
    color: theme.colors.bubbleMeText,
  },
  textOther: {
    color: theme.colors.bubbleOtherText,
  },
  time: {
    marginTop: 6,
    ...theme.typography.small,
  },
  timeMe: {
    color: "rgba(255,255,255,0.85)",
  },
  timeOther: {
    color: theme.colors.mutedText,
  },
  composer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.bg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});
