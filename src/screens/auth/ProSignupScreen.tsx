// @ts-nocheck
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";

import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { TextField } from "../../components/TextField";
import { Button } from "../../components/Button";
import { useTheme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";
import { beginUpgradeToPro } from "../../services/onboardingService";

const PRO_WORKSPACE_ID = "ws_businesscafe";

export function ProSignupScreen({ navigation }: any) {
  const { backendMode } = useAppState();
  const actions = useAppActions();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSignup() {
    const e = String(email || "").trim();
    const p = String(password || "");
    if (!e || !p) return;

    setLoading(true);

    const ok = await actions.safeCall(
      async () => {
        await actions.register({
          workspaceId: PRO_WORKSPACE_ID,
          role: "BUSINESS",
          fullName: "Business",
          email: e,
          phone: "",
          password: p,
        });

        // Immediately upgrade to BUSINESS server-side (CLOUD) and enforce onboarding.
        // In MOCK this is a no-op aside from session patching.
        await beginUpgradeToPro({ backendMode, actions, reason: "pro_signup" });
      },
      { title: "Sign up" }
    );

    setLoading(false);

    if (ok) {
      // RootNavigator will switch to AppStack; AppStack will force onboarding if needed.
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Pro signup</Text>
        <Text style={styles.subtitle}>Manage your business and clients</Text>

        <Card style={styles.card}>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@company.com"
            autoCapitalize="none"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />
          <Button title="Create account" onPress={onSignup} loading={loading} />

          {backendMode === "CLOUD" ? (
            <Text style={styles.hint}>
              If email confirmation is enabled, confirm your email then login to
              continue onboarding.
            </Text>
          ) : (
            <Text style={styles.hint}>
              Mock signup (no email verification).
            </Text>
          )}
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
