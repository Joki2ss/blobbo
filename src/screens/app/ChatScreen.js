import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, View, StyleSheet, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../../components/Screen";
import { Header } from "../../components/Header";
import { ChatSelection } from "../../ui/components/ChatSelection";
import { useTheme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";
import { listDeletedThreadIds, markThreadDeleted } from "../../chat/ChatDeleteStore";

export function ChatScreen({ navigation }) {
  const { workspace, session } = useAppState();
  const actions = useAppActions();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [threads, setThreads] = useState([]);
  const [clientsById, setClientsById] = useState({});

  const subtitle = useMemo(() => (workspace ? `${workspace.name}` : ""), [workspace]);

  async function refresh() {
    if (!workspace?.id) return;
    const userId = session?.user?.id || "";
    const [clients, threads] = await Promise.all([
      actions.backend.clients.list({ workspaceId: workspace.id }),
      actions.backend.chat.listThreads({ workspaceId: workspace.id }),
    ]);

    const deleted = userId ? await listDeletedThreadIds({ userId }) : [];
    const filteredThreads = Array.isArray(threads) ? threads.filter((t) => !deleted.includes(String(t.clientId))) : [];

    const map = {};
    for (const c of clients) map[c.id] = c;
    setClientsById(map);
    setThreads(filteredThreads);
  }

  useEffect(() => {
    actions.safeCall(refresh, { title: "Load failed" });
  }, [workspace?.id]);

  return (
    <Screen>
      <Header
        title="Chat"
        subtitle={subtitle}
        right={
          <Pressable
            onPress={() => navigation.navigate("NewMessage")}
            style={({ pressed }) => [styles.newBtn, pressed ? { opacity: 0.85 } : null]}
          >
            <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
          </Pressable>
        }
      />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: theme.spacing.xl }}>
        {threads.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No conversations yet.</Text>
          </View>
        ) : (
          threads.map((t) => {
            const c = clientsById[t.clientId];
            const title = c?.name || `Client ${t.clientId}`;
            return (
              <ChatSelection
                key={t.clientId}
                title={title}
                subtitle={t.lastText}
                unreadCount={t.unreadCount}
                onPress={async () => {
                  actions.selectClient(t.clientId);
                  await actions.backend.chat.markThreadRead({ workspaceId: workspace.id, clientId: t.clientId });
                  navigation.navigate("ChatThread", { clientId: t.clientId });
                }}
              />
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}
function makeStyles(theme) {
  return StyleSheet.create({
    empty: {
      padding: theme.spacing.xl,
    },
    emptyText: {
      ...theme.typography.body,
      color: theme.colors.mutedText,
    },
    newBtn: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.chipBg,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
