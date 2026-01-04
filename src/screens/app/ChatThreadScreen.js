import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../../components/Screen";
import { TextField } from "../../components/TextField";
import { Button } from "../../components/Button";
import { useTheme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";
import { isAdminOrBusiness } from "../../utils/roles";
import { formatTime } from "../../utils/date";
import { logEvent } from "../../services/logger";
import { getSupportRuntimeConfig } from "../../config/supportFlags";
import { AdvancedMessageInput } from "../../chat/AdvancedMessageInput";

export function ChatThreadScreen({ navigation, route }) {
  const { workspace, session, backendMode } = useAppState();
  const actions = useAppActions();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const clientId = route?.params?.clientId;

  const cfg = useMemo(() => getSupportRuntimeConfig({ backendMode }), [backendMode]);

  const [client, setClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [editingScheduled, setEditingScheduled] = useState(null);

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

  async function onSendBasic() {
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

  async function onSendAdvanced({ text, media, location, scheduledAt }) {
    if (!workspace?.id || !session?.user || !clientId) return;

    const trimmed = String(text || "").trim();
    if (!trimmed && (!Array.isArray(media) || media.length === 0) && !location) return;

    setSending(true);
    setText("");
    logEvent("chat_send", { workspaceId: workspace.id, clientId });

    await actions.safeCall(async () => {
      const senderType = isAdminOrBusiness(session.user.role) ? "ADMIN" : "CLIENT";

      if (editingScheduled?.messageId && backendMode === "MOCK") {
        await actions.backend.chat.updateScheduledMessage({
          workspaceId: workspace.id,
          messageId: editingScheduled.messageId,
          patch: {
            text: trimmed,
            media,
            location,
            scheduledAt,
          },
        });
        setEditingScheduled(null);
      } else {
        await actions.backend.chat.sendMessage({
          workspaceId: workspace.id,
          clientId,
          senderType,
          senderId: session.user.id,
          text: trimmed,
          media,
          location,
          scheduledAt,
          simulateReply: backendMode === "MOCK" && isAdminOrBusiness(session.user.role) && !(scheduledAt && scheduledAt > Date.now()),
        });
      }

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
            const status = item.status || "SENT";
            const senderType = item.senderType || item.senderRole;
            const isMe = item.senderId === session?.user?.id && senderType !== "CLIENT";
            const bubbleStyle = isMe ? styles.bubbleMe : styles.bubbleOther;
            const textStyle = isMe ? styles.textMe : styles.textOther;
            return (
              <View style={[styles.row, isMe ? styles.rowMe : styles.rowOther]}>
                <View style={[styles.bubble, bubbleStyle]}>
                  <Text style={[styles.msgText, textStyle]}>{item.text}</Text>
                  {status === "SCHEDULED" ? (
                    <Text style={[styles.time, isMe ? styles.timeMe : styles.timeOther]}>
                      Scheduled • {item.scheduledAt ? new Date(item.scheduledAt).toLocaleString() : ""}
                    </Text>
                  ) : status === "CANCELED" ? (
                    <Text style={[styles.time, isMe ? styles.timeMe : styles.timeOther]}>Canceled</Text>
                  ) : null}
                  <Text style={[styles.time, isMe ? styles.timeMe : styles.timeOther]}>{formatTime(item.createdAt)}</Text>

                  {cfg.ADVANCED_MESSAGING_ENABLED && backendMode === "MOCK" && isMe && status === "SCHEDULED" ? (
                    <View style={styles.scheduledActions}>
                      <Pressable
                        onPress={() => {
                          setEditingScheduled({ messageId: item.messageId || item.id });
                          setText(item.text || "");
                        }}
                        style={({ pressed }) => [styles.actionChip, pressed ? { opacity: 0.85 } : null]}
                      >
                        <Text style={styles.actionText}>Edit</Text>
                      </Pressable>
                      <Pressable
                        onPress={async () => {
                          const mid = item.messageId || item.id;
                          const ok = await actions.safeCall(
                            () => actions.backend.chat.cancelScheduledMessage({ workspaceId: workspace.id, messageId: mid }),
                            { title: "Cancel" }
                          );
                          if (ok?.ok) refresh();
                        }}
                        style={({ pressed }) => [styles.actionChip, pressed ? { opacity: 0.85 } : null]}
                      >
                        <Text style={styles.actionText}>Cancel</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              </View>
            );
          }}
        />

        {cfg.ADVANCED_MESSAGING_ENABLED ? (
          <AdvancedMessageInput
            backendMode={backendMode}
            value={text}
            onChange={setText}
            onSend={onSendAdvanced}
            disabled={sending}
            editing={!!editingScheduled}
            onCancelEditing={() => setEditingScheduled(null)}
          />
        ) : (
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
                  onPress={canSend ? onSendBasic : undefined}
                />
              }
            />
            <Button title="Send" onPress={onSendBasic} disabled={!canSend} loading={sending} />
          </View>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}


function makeStyles(theme) {
  return StyleSheet.create({
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
      color: theme.colors.bubbleMeText,
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
    scheduledActions: {
      flexDirection: "row",
      gap: theme.spacing.xs,
      marginTop: theme.spacing.xs,
    },
    actionChip: {
      backgroundColor: theme.colors.chipBg,
      borderRadius: theme.radius.pill,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 6,
    },
    actionText: {
      ...theme.typography.small,
      color: theme.colors.text,
    },
  });
}
