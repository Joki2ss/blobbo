import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { Chip } from "../../components/Chip";
import { Button } from "../../components/Button";
import { theme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";
import { formatDateTime } from "../../utils/date";

export function ClientDetailScreen({ navigation, route }) {
  const { workspace } = useAppState();
  const actions = useAppActions();
  const clientId = route?.params?.clientId;

  const [client, setClient] = useState(null);
  const [docs, setDocs] = useState([]);
  const [timeline, setTimeline] = useState([]);

  const title = useMemo(() => client?.name || "Client", [client]);

  useEffect(() => {
    navigation.setOptions({ title });
  }, [title]);

  async function refresh() {
    if (!workspace?.id || !clientId) return;
    const c = await actions.safeCall(() => actions.backend.clients.getById({ workspaceId: workspace.id, clientId }), { title: "Load failed" });
    if (c) setClient(c);

    const d = await actions.safeCall(() => actions.backend.documents.listForClient({ workspaceId: workspace.id, clientId }), { title: "Load failed" });
    if (d) setDocs(d);

    const t = await actions.safeCall(() => actions.backend.activity.list({ workspaceId: workspace.id, clientId }), { title: "Load failed" });
    if (t) setTimeline(t);
  }

  useEffect(() => {
    refresh();
  }, [workspace?.id, clientId]);

  if (!client) {
    return <Screen />;
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.name}>{client.name}</Text>
          <Text style={styles.muted}>{client.email}</Text>
          <Text style={styles.muted}>{client.phone}</Text>

          <View style={styles.row}>
            <Chip label={(client.status || "active").toUpperCase()} tone="success" />
          </View>

          <View style={{ height: theme.spacing.lg }} />
          <Button title="Open chat" onPress={() => navigation.navigate("ChatThread", { clientId: client.id })} />
          <View style={{ height: theme.spacing.md }} />
          <Button title="New document request" variant="secondary" onPress={() => navigation.navigate("NewDocumentRequest", { clientId: client.id })} />
        </Card>

        <Text style={styles.section}>Document requests</Text>
        {docs.length === 0 ? (
          <Card style={styles.card}><Text style={styles.muted}>No document requests yet.</Text></Card>
        ) : (
          docs.map((d) => (
            <Card key={d.id} style={styles.card}>
              <View style={styles.docRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docTitle}>{d.title}</Text>
                  <Text style={styles.muted}>{formatDateTime(d.createdAt)}</Text>
                </View>
                <Chip
                  label={d.status.toUpperCase()}
                  tone={d.status === "completed" ? "success" : d.status === "partial" ? "warning" : "default"}
                />
              </View>

              <View style={{ height: theme.spacing.md }} />
              {d.items.map((it) => (
                <Pressable
                  key={it.id}
                  onPress={async () => {
                    await actions.safeCall(() => actions.backend.documents.toggleItem({ workspaceId: workspace.id, requestId: d.id, itemId: it.id }), { title: "Update failed" });
                    refresh();
                  }}
                  style={styles.checkRow}
                >
                  <Ionicons name={it.done ? "checkbox" : "square-outline"} size={20} color={it.done ? theme.colors.success : theme.colors.mutedText} />
                  <Text style={[styles.checkText, it.done ? styles.checkDone : null]}>{it.label}</Text>
                </Pressable>
              ))}
            </Card>
          ))
        )}

        <Text style={styles.section}>Activity</Text>
        {timeline.length === 0 ? (
          <Card style={styles.card}><Text style={styles.muted}>No activity yet.</Text></Card>
        ) : (
          timeline.map((a) => (
            <Card key={a.id} style={styles.card}>
              <Text style={styles.docTitle}>{a.title}</Text>
              <Text style={styles.muted}>{a.detail}</Text>
              <Text style={styles.muted}>{formatDateTime(a.createdAt)}</Text>
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  card: {
    marginBottom: theme.spacing.md,
  },
  name: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  muted: {
    ...theme.typography.small,
    color: theme.colors.mutedText,
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    marginTop: theme.spacing.md,
  },
  section: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  docTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  checkText: {
    marginLeft: theme.spacing.sm,
    ...theme.typography.body,
    color: theme.colors.text,
  },
  checkDone: {
    color: theme.colors.mutedText,
    textDecorationLine: "line-through",
  },
});
