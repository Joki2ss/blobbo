import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, View, StyleSheet, Text } from "react-native";

import { Screen } from "../../components/Screen";
import { Header } from "../../components/Header";
import { ListRow } from "../../components/ListRow";
import { Badge } from "../../components/Badge";
import { theme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";

export function ChatScreen({ navigation }) {
  const { workspace } = useAppState();
  const actions = useAppActions();

  const [threads, setThreads] = useState([]);
  const [clientsById, setClientsById] = useState({});

  const subtitle = useMemo(() => (workspace ? `${workspace.name}` : ""), [workspace]);

  async function refresh() {
    if (!workspace?.id) return;
    const [clients, threads] = await Promise.all([
      actions.backend.clients.list({ workspaceId: workspace.id }),
      actions.backend.chat.listThreads({ workspaceId: workspace.id }),
    ]);

    const map = {};
    for (const c of clients) map[c.id] = c;
    setClientsById(map);
    setThreads(threads);
  }

  useEffect(() => {
    actions.safeCall(refresh, { title: "Load failed" });
  }, [workspace?.id]);

  return (
    <Screen>
      <Header title="Chat" subtitle={subtitle} />
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
              <ListRow
                key={t.clientId}
                title={title}
                subtitle={t.lastText}
                badge={<Badge count={t.unreadCount} />}
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

const styles = StyleSheet.create({
  empty: {
    padding: theme.spacing.xl,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.mutedText,
  },
});
