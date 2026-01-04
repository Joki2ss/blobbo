import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";

import { Screen } from "../../components/Screen";
import { Header } from "../../components/Header";
import { Card } from "../../components/Card";
import { theme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";
import { formatDateTime } from "../../utils/date";

export function ActivityScreen() {
  const { workspace } = useAppState();
  const actions = useAppActions();

  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [events, setEvents] = useState([]);

  const subtitle = useMemo(() => (workspace ? `${workspace.name}` : ""), [workspace]);

  async function refresh() {
    if (!workspace?.id) return;
    const cs = await actions.backend.clients.list({ workspaceId: workspace.id });
    setClients(cs);

    const ev = await actions.backend.activity.list({ workspaceId: workspace.id, clientId: selectedClientId || undefined });
    setEvents(ev);
  }

  useEffect(() => {
    actions.safeCall(refresh, { title: "Load failed" });
  }, [workspace?.id, selectedClientId]);

  return (
    <Screen>
      <Header title="Activity" subtitle={subtitle} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        <Pressable onPress={() => setSelectedClientId(null)} style={[styles.filterPill, !selectedClientId ? styles.filterActive : null]}>
          <Text style={[styles.filterText, !selectedClientId ? styles.filterTextActive : null]}>All</Text>
        </Pressable>
        {clients.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => setSelectedClientId(c.id)}
            style={[styles.filterPill, selectedClientId === c.id ? styles.filterActive : null]}
          >
            <Text style={[styles.filterText, selectedClientId === c.id ? styles.filterTextActive : null]}>{c.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content}>
        {events.length === 0 ? (
          <Card><Text style={styles.muted}>No activity yet.</Text></Card>
        ) : (
          events.map((e) => (
            <Card key={e.id} style={styles.card}>
              <Text style={styles.title}>{e.title}</Text>
              <Text style={styles.muted}>{e.detail}</Text>
              <Text style={styles.muted}>{formatDateTime(e.createdAt)}</Text>
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  filterPill: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  filterActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.chipBg,
  },
  filterText: {
    ...theme.typography.small,
    color: theme.colors.text,
    fontWeight: "700",
  },
  filterTextActive: {
    color: theme.colors.primary,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  card: {
    marginBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  muted: {
    ...theme.typography.small,
    color: theme.colors.mutedText,
    marginTop: 4,
  },
});
