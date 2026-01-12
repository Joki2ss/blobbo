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
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState([]);

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

  // Bulk actions
  const allSelected = selected.length === threads.length && threads.length > 0;
  const toggleSelect = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };
  const selectAll = () => setSelected(threads.map((t) => t.clientId));
  const clearSelection = () => setSelected([]);
  const exitSelection = () => { setSelectionMode(false); clearSelection(); };

  const handleDelete = async () => {
    for (const id of selected) {
      await markThreadDeleted({ userId: session.user.id, clientId: id });
    }
    clearSelection();
    setSelectionMode(false);
    refresh();
  };
  const handleExport = () => {
    // Fallback: JSON export
    const exported = threads.filter((t) => selected.includes(t.clientId));
    const json = JSON.stringify(exported, null, 2);
    // In Snack: show as alert, in native: use share sheet
    if (typeof window !== "undefined") alert(json);
  };

  return (
    <Screen>
      <Header
        title={selectionMode ? `${selected.length} selected` : "Chat"}
        subtitle={subtitle}
        right={
          selectionMode ? (
            <View style={{ flexDirection: "row" }}>
              <Pressable onPress={selectAll} style={styles.newBtn}><Ionicons name="checkbox-outline" size={18} color={theme.colors.primary} /></Pressable>
              <Pressable onPress={handleExport} style={styles.newBtn}><Ionicons name="download-outline" size={18} color={theme.colors.primary} /></Pressable>
              <Pressable onPress={handleDelete} style={styles.newBtn}><Ionicons name="trash-outline" size={18} color={theme.colors.danger} /></Pressable>
              <Pressable onPress={exitSelection} style={styles.newBtn}><Ionicons name="close-outline" size={18} color={theme.colors.mutedText} /></Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => navigation.navigate("NewMessage")}
              style={({ pressed }) => [styles.newBtn, pressed ? { opacity: 0.85 } : null]}
            >
              <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
            </Pressable>
          )
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
                selected={selectionMode && selected.includes(t.clientId)}
                onPress={selectionMode
                  ? () => toggleSelect(t.clientId)
                  : async () => {
                      actions.selectClient(t.clientId);
                      await actions.backend.chat.markThreadRead({ workspaceId: workspace.id, clientId: t.clientId });
                      navigation.navigate("ChatThread", { clientId: t.clientId });
                    }
                }
                onLongPress={() => { setSelectionMode(true); toggleSelect(t.clientId); }}
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
