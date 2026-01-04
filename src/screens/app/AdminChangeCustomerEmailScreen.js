import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, Alert } from "react-native";

import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { TextField } from "../../components/TextField";
import { Button } from "../../components/Button";
import { theme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";

export function AdminChangeCustomerEmailScreen({ navigation, route }) {
  const { workspace } = useAppState();
  const actions = useAppActions();
  const clientId = route?.params?.clientId;

  const [linkedUser, setLinkedUser] = useState(null);
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!workspace?.id || !clientId) return;
      const u = await actions.safeCall(
        () => actions.backend.users.getByClientId({ workspaceId: workspace.id, clientId }),
        { title: "Load" }
      );
      if (mounted) {
        setLinkedUser(u);
        setEmail(u?.email || "");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [workspace?.id, clientId]);

  const canSave = useMemo(() => {
    return !!email.trim();
  }, [email]);

  async function save() {
    const next = email.trim().toLowerCase();
    if (!next) return;
    setSaving(true);

    const updated = await actions.safeCall(
      () => actions.adminChangeCustomerEmail({ clientId, email: next }),
      { title: "Email" }
    );

    setSaving(false);
    if (updated) {
      Alert.alert("Updated", "Customer login email updated.");
      navigation.goBack();
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Change customer login email</Text>

        <Card style={styles.card}>
          <Text style={styles.muted}>This is an admin-only action.</Text>
          <Text style={styles.muted}>Email is treated as an immutable identifier for customers.</Text>

          <Text style={[styles.section, { marginTop: theme.spacing.md }]}>Linked customer</Text>
          <Text style={styles.muted}>{linkedUser?.fullName || "No linked user"}</Text>

          <TextField label="New email" value={email} onChangeText={setEmail} placeholder="customer@email.com" />
          <Button title="Save" onPress={save} loading={saving} disabled={!canSave || saving} />
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
    marginBottom: theme.spacing.md,
  },
  card: {
    marginBottom: theme.spacing.md,
  },
  section: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  muted: {
    ...theme.typography.small,
    color: theme.colors.mutedText,
    marginTop: 4,
  },
});
