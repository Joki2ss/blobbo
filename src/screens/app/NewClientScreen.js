import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";

import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { TextField } from "../../components/TextField";
import { Button } from "../../components/Button";
import { theme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";

export function NewClientScreen({ navigation }) {
  const { workspace } = useAppState();
  const actions = useAppActions();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const canCreate = useMemo(() => name.trim() && email.trim(), [name, email]);

  async function onCreate() {
    if (!workspace?.id) return;
    setLoading(true);
    const created = await actions.safeCall(
      () => actions.backend.clients.create({ workspaceId: workspace.id, name: name.trim(), email: email.trim(), phone: phone.trim() }),
      { title: "Create failed" }
    );
    setLoading(false);
    if (created) {
      actions.selectClient(created.id);
      navigation.replace("ClientDetail", { clientId: created.id });
    }
  }

  return (
    <Screen>
      <View style={styles.content}>
        <Text style={styles.title}>Add a client</Text>
        <Text style={styles.subtitle}>Workspace isolated by workspaceId</Text>

        <Card>
          <TextField label="Name" value={name} onChangeText={setName} placeholder="Client name" />
          <TextField label="Email" value={email} onChangeText={setEmail} placeholder="client@company.com" />
          <TextField label="Phone (optional)" value={phone} onChangeText={setPhone} placeholder="+1 ..." />
          <Button title="Create" onPress={onCreate} disabled={!canCreate} loading={loading} />
          <View style={{ height: theme.spacing.md }} />
          <Button title="Cancel" variant="secondary" onPress={() => navigation.goBack()} />
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
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
});
