// @ts-nocheck
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { TextField } from "../../components/TextField";
import { Button } from "../../components/Button";
import { useTheme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";

const CUSTOMER_WORKSPACE_ID = "ws_businesscafe";

export function CustomerSignupScreen({ navigation }: any) {
  const { backendMode } = useAppState();
  const actions = useAppActions();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit =
    !!String(firstName || "").trim() &&
    !!String(lastName || "").trim() &&
    (!!String(email || "").trim() || !!String(phone || "").trim()) &&
    !!String(password || "");

  async function onSignup() {
    if (!canSubmit) return;

    const fn = String(firstName || "").trim();
    const ln = String(lastName || "").trim();
    const e = String(email || "").trim();
    const ph = String(phone || "").trim();
    const p = String(password || "");
    const fullName = [fn, ln].filter(Boolean).join(" ");

    setLoading(true);
    const ok = await actions.safeCall(
      async () => {
        await actions.register({
          workspaceId: CUSTOMER_WORKSPACE_ID,
          role: "CUSTOMER",
          fullName,
          firstName: fn,
          lastName: ln,
          email: e,
          phone: ph,
          password: p,
        });
      },
      { title: "Sign up" }
    );
    setLoading(false);

    if (ok) {
      // RootNavigator will switch to AppStack.
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Customer signup</Text>
        <Text style={styles.subtitle}>Discover professionals and services</Text>

        <Card style={styles.card}>
          <TextField
            label="Name"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Name"
          />
          <TextField
            label="Surname"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Surname"
          />
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            autoCapitalize="none"
          />
          <TextField
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            placeholder="+39 ..."
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />
          <Button
            title="Create account"
            onPress={onSignup}
            loading={loading}
            disabled={!canSubmit}
          />

          {backendMode === "CLOUD" ? (
            <Text style={styles.hint}>
              Cloud signup may require email confirmation depending on your
              Supabase settings.
            </Text>
          ) : (
            <Text style={styles.hint}>
              Mock signup (no email verification).
            </Text>
          )}

          <Text style={styles.hint}>
            Email or phone is required (at least one).
          </Text>
        </Card>

        <Button
          title="Back"
          variant="secondary"
          onPress={() => navigation.goBack()}
        />
      </ScrollView>
    </Screen>
  );
}

function makeStyles(theme: any) {
  return StyleSheet.create({
    content: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: theme.spacing.xl,
      paddingBottom: theme.spacing.xl,
    },
    title: {
      ...(theme.typography.h1 || {}),
      color: theme.colors.text,
    },
    subtitle: {
      ...(theme.typography.small || {}),
      color: theme.colors.mutedText,
      marginTop: 6,
      marginBottom: theme.spacing.lg,
    },
    card: {
      padding: theme.spacing.xl,
      marginBottom: theme.spacing.md,
    },
    hint: {
      ...(theme.typography.small || {}),
      color: theme.colors.mutedText,
      marginTop: theme.spacing.md,
      textAlign: "center",
    },
  });
}
