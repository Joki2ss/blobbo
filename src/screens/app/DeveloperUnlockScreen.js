import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, Alert } from "react-native";

import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { TextField } from "../../components/TextField";
import { Button } from "../../components/Button";
import { theme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";
import { isDeveloperUser } from "../../support/SupportPermissions";

export function DeveloperUnlockScreen({ navigation }) {
  const { developerUnlocked, session } = useAppState();
  const actions = useAppActions();

  const user = session?.user;
  const allowed = isDeveloperUser(user);

  const [code, setCode] = useState("");
  const [working, setWorking] = useState(false);

  async function unlock() {
    if (!allowed) {
      Alert.alert("Forbidden", "Developer unlock is restricted to the developer allowlist.");
      return;
    }
    setWorking(true);
    const ok = await actions.safeCall(() => actions.unlockDeveloperTools(code), { title: "Developer tools" });
    setWorking(false);
    if (ok) {
      Alert.alert("Unlocked", "Developer tools enabled on this device.");
      navigation.goBack();
    }
  }

  async function lock() {
    setWorking(true);
    await actions.safeCall(() => actions.lockDeveloperTools(), { title: "Developer tools" });
    setWorking(false);
    Alert.alert("Locked", "Developer tools disabled on this device.");
    navigation.goBack();
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Developer tools</Text>
        <Text style={styles.muted}>Requires allowlisted email + developer code (12h TTL).</Text>

        <Card style={styles.card}>
          <Text style={styles.section}>Unlock</Text>
          {!allowed ? <Text style={styles.muted}>This account is not allowlisted.</Text> : null}
          <TextField
            label="Unlock code"
            value={code}
            onChangeText={setCode}
            placeholder="Enter code"
            autoCapitalize="none"
          />
          <Button title={developerUnlocked ? "Re-unlock" : "Unlock"} onPress={unlock} loading={working} disabled={!allowed} />

          <Text style={[styles.muted, { marginTop: theme.spacing.md }]}>Status: {developerUnlocked ? "UNLOCKED" : "LOCKED"}</Text>

          {developerUnlocked ? (
            <>
              <Text style={[styles.section, { marginTop: theme.spacing.md }]}>Lock</Text>
              <Button title="Lock developer tools" variant="secondary" onPress={lock} disabled={working} />
            </>
          ) : null}
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
    marginBottom: theme.spacing.sm,
  },
  muted: {
    ...theme.typography.small,
    color: theme.colors.mutedText,
    marginTop: 4,
  },
});
