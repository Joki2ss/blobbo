import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { TextField } from "../../components/TextField";
import { Button } from "../../components/Button";
import { ListRow } from "../../components/ListRow";
import { theme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";

export function NewMessageScreen({ navigation }) {
  const { workspace } = useAppState();
  const actions = useAppActions();

  const [query, setQuery] = useState("");
  const [clientId, setClientId] = useState("");
  const [clients, setClients] = useState([]);

  const canOpen = useMemo(() => clientId.trim().length > 0, [clientId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!workspace?.id) return;
      const list = await actions.safeCall(
        () => actions.backend.clients.list({ workspaceId: workspace.id, query }),
        { title: "Load failed" }
      );
      if (mounted && list) setClients(list);
    })();
    return () => {
      mounted = false;
    };
  }, [workspace?.id, query]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>New message</Text>
        <Text style={styles.subtitle}>Pick a contact or paste a clientId</Text>

        <Card style={styles.card}>
          <TextField label="Search" value={query} onChangeText={setQuery} placeholder="Name or email" />
          <TextField label="Client ID (optional)" value={clientId} onChangeText={setClientId} placeholder="c_..." />
          <Button
            title="Open chat"
            onPress={() => {
              const id = clientId.trim();
              actions.selectClient(id);
              navigation.replace("ChatThread", { clientId: id });
            }}
            disabled={!canOpen}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.section}>Contacts</Text>
          {clients.map((c) => (
            <ListRow
              key={c.id}
              title={c.name}
              subtitle={c.email}
              onPress={() => {
                actions.selectClient(c.id);
                navigation.replace("ChatThread", { clientId: c.id });
              }}
            />
          ))}
        </Card>

        <Button title="Cancel" variant="secondary" onPress={() => navigation.goBack()} />
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
    ...theme.typography.h1,
    color: theme.colors.text,
  },
  subtitle: {
    ...theme.typography.small,
    color: theme.colors.mutedText,
    marginTop: 6,
    marginBottom: theme.spacing.lg,
  },
  card: {
    marginBottom: theme.spacing.md,
  },
  section: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
});
