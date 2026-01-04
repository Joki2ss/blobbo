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
import { createSupportTicket, listTicketsForUser } from "../../support/SupportTicketsService";

const CATEGORIES = ["Technical", "Security", "Payment", "Other"];

export function SupportTicketsListScreen({ navigation }) {
  const { session, backendMode } = useAppState();
  const actions = useAppActions();
  const user = session?.user;

  const cfg = useMemo(() => getSupportRuntimeConfig({ backendMode }), [backendMode]);

  const [tickets, setTickets] = useState([]);
  const [subject, setSubject] = useState("");
  const [categoryIndex, setCategoryIndex] = useState(0);
  const category = CATEGORIES[categoryIndex];

  async function refresh() {
    if (!cfg.SUPPORT_TICKETS_ENABLED) return;
    const list = await actions.safeCall(() => listTicketsForUser({ backendMode, sessionUser: user }), { title: "Tickets" });
    if (list) setTickets(list);
  }

  useEffect(() => {
    refresh();
  }, [backendMode, user?.id]);

  const canCreate = useMemo(() => subject.trim().length > 3, [subject]);

  async function create() {
    const t = await actions.safeCall(
      () => createSupportTicket({ backendMode, sessionUser: user, subject: subject.trim(), category }),
      { title: "Tickets" }
    );
    if (t) {
      setSubject("");
      setCategoryIndex(0);
      refresh();
      navigation.navigate("SupportTicketDetail", { ticketId: t.ticketId });
    }
  }

  if (!cfg.SUPPORT_TICKETS_ENABLED) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Support tickets</Text>
          <Text style={styles.muted}>Support tickets are disabled in this mode.</Text>
          <Button title="Back" variant="secondary" onPress={() => navigation.goBack()} />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Support tickets</Text>
        <Text style={styles.muted}>You can see only your own tickets.</Text>

        <Card style={styles.card}>
          <Text style={styles.h}>Create ticket</Text>
          <TextField label="Subject" value={subject} onChangeText={setSubject} placeholder="Short summary" />

          <Text style={styles.label}>Category</Text>
          <View style={styles.row}>
            {CATEGORIES.map((c, idx) => (
              <Button
                key={c}
                title={c}
                variant={categoryIndex === idx ? "primary" : "secondary"}
                onPress={() => setCategoryIndex(idx)}
              />
            ))}
          </View>

          <Button title="Create" onPress={create} disabled={!canCreate} />
          <View style={{ height: theme.spacing.sm }} />
          <Button title="Refresh" variant="secondary" onPress={refresh} />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.h}>My tickets</Text>
          {tickets.length === 0 ? (
            <Text style={styles.muted}>No tickets yet.</Text>
          ) : (
            tickets.map((t) => (
              <ListRow
                key={t.ticketId}
                title={`${t.subject}`}
                subtitle={`${t.category} • ${t.status}`}
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
  muted: {
    ...theme.typography.small,
    color: theme.colors.mutedText,
    marginTop: 6,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
});
