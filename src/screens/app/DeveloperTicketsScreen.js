import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { TextField } from "../../components/TextField";
import { Button } from "../../components/Button";
import { ListRow } from "../../components/ListRow";
import { theme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";
import { getSupportRuntimeConfig } from "../../config/supportFlags";
import { listAllTicketsForDeveloper } from "../../support/SupportTicketsService";
import { requireDeveloperSession } from "../../support/SupportPermissions";

const STATUS = ["All", "OPEN", "IN_PROGRESS", "CLOSED"];

export function DeveloperTicketsScreen({ navigation }) {
  const { backendMode, session } = useAppState();
  const actions = useAppActions();
  const cfg = useMemo(() => getSupportRuntimeConfig({ backendMode }), [backendMode]);

  const user = session?.user;

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("");
  const [createdAfter, setCreatedAfter] = useState("");
  const [createdBefore, setCreatedBefore] = useState("");

  const [tickets, setTickets] = useState([]);

  async function refresh() {
    if (!cfg.SUPPORT_TICKETS_ENABLED) return;
    const list = await actions.safeCall(
      async () => {
        await requireDeveloperSession(user);
        return listAllTicketsForDeveloper({
          backendMode,
          sessionUser: user,
          filters: {
            query,
            status,
            userId: userId.trim(),
            role: role.trim(),
            createdAfter: createdAfter.trim(),
            createdBefore: createdBefore.trim(),
          },
        });
      },
      { title: "Tickets" }
    );
    if (list) setTickets(list);
  }

  useEffect(() => {
    refresh();
    if (backendMode !== "MOCK") return;

    const id = setInterval(() => {
      refresh();
    }, 2500);

    return () => clearInterval(id);
  }, [backendMode, user?.id, query, status, userId, role, createdAfter, createdBefore]);

  if (!cfg.SUPPORT_TICKETS_ENABLED) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>All tickets</Text>
          <Text style={styles.muted}>Support tickets are disabled in this mode.</Text>
          <Button title="Back" variant="secondary" onPress={() => navigation.goBack()} />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>All tickets</Text>
        <Text style={styles.muted}>Developer-only global view (MOCK_DATA).</Text>

        <Card style={styles.card}>
          <TextField label="Search" value={query} onChangeText={setQuery} placeholder="ticketId, subject, userId..." />
          <TextField label="UserId" value={userId} onChangeText={setUserId} placeholder="optional" />
          <TextField label="Role" value={role} onChangeText={setRole} placeholder="ADMIN / CLIENT ..." />
          <TextField label="Created after (YYYY-MM-DD)" value={createdAfter} onChangeText={setCreatedAfter} placeholder="optional" />
          <TextField label="Created before (YYYY-MM-DD)" value={createdBefore} onChangeText={setCreatedBefore} placeholder="optional" />

          <Text style={styles.label}>Status</Text>
          <View style={styles.row}>
            {STATUS.map((s) => (
              <Button key={s} title={s} variant={status === s ? "primary" : "secondary"} onPress={() => setStatus(s)} />
            ))}
          </View>

          <Button title="Refresh" variant="secondary" onPress={refresh} />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.h}>Tickets</Text>
          {tickets.length === 0 ? (
            <Text style={styles.muted}>No tickets.</Text>
          ) : (
            tickets.map((t) => (
              <ListRow
                key={t.ticketId}
                title={`${t.subject}`}
                subtitle={`${t.createdByRole} • ${t.status} • ${t.ticketId}`}
                onPress={() => navigation.navigate("SupportTicketDetail", { ticketId: t.ticketId })}
              />
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
  h: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  label: {
    ...theme.typography.small,
    color: theme.colors.mutedText,
    marginBottom: theme.spacing.sm,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
});
