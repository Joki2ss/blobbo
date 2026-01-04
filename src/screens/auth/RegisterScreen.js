import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";

import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { TextField } from "../../components/TextField";
import { Button } from "../../components/Button";
import { useTheme } from "../../theme";
import { useAppActions } from "../../store/AppStore";

const ROLE_OPTIONS = ["ADMIN", "CLIENT"];
const WORKSPACE_OPTIONS = [
  { id: "ws_acme", name: "Acme Ops" },
  { id: "ws_beta", name: "Beta Holdings" },
];

export function RegisterScreen({ navigation }) {
  const actions = useAppActions();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [workspaceId, setWorkspaceId] = useState("ws_acme");
  const [roleIndex, setRoleIndex] = useState(0);
  const role = useMemo(() => ROLE_OPTIONS[roleIndex], [roleIndex]);

  const [fullName, setFullName] = useState("New User");
  const [email, setEmail] = useState("newuser@acme.com");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("password");
  const [loading, setLoading] = useState(false);

  async function onRegister() {
    setLoading(true);
    await actions.safeCall(async () => {
      await actions.register({ workspaceId, role, fullName, email, phone, password });
    }, { title: "Registration failed" });
    setLoading(false);
  }

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Mock registration (no email verification)</Text>

        <Card style={styles.card}>
          <View style={styles.row}>
            {WORKSPACE_OPTIONS.map((w) => (
              <Pressable
                key={w.id}
                onPress={() => setWorkspaceId(w.id)}
                style={[styles.pill, workspaceId === w.id ? styles.pillActive : null]}
              >
                <Text style={[styles.pillText, workspaceId === w.id ? styles.pillTextActive : null]}>{w.name}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.row}>
            {ROLE_OPTIONS.map((r, idx) => (
              <Pressable key={r} onPress={() => setRoleIndex(idx)} style={[styles.pill, roleIndex === idx ? styles.pillActive : null]}>
                <Text style={[styles.pillText, roleIndex === idx ? styles.pillTextActive : null]}>{r}</Text>
              </Pressable>
            ))}
          </View>

          <TextField label="Full name" value={fullName} onChangeText={setFullName} placeholder="Full name" />
          <TextField label="Email" value={email} onChangeText={setEmail} placeholder="you@company.com" />
          <TextField label="Phone (optional)" value={phone} onChangeText={setPhone} placeholder="+1 ..." />
          <TextField label="Password" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />

          <Button title="Create account" onPress={onRegister} loading={loading} />

          <View style={styles.links}>
            <Pressable onPress={() => navigation.goBack()}>
              <Text style={styles.link}>Back to login</Text>
            </Pressable>
          </View>
        </Card>
      </View>
    </Screen>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: theme.spacing.xl,
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
    card: {
      padding: theme.spacing.xl,
    },
    row: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
      flexWrap: "wrap",
    },
    pill: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.pill,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    pillActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.chipBg,
    },
    pillText: {
      ...theme.typography.small,
      color: theme.colors.text,
      fontWeight: "700",
    },
    pillTextActive: {
      color: theme.colors.primary,
    },
    links: {
      marginTop: theme.spacing.md,
      alignItems: "center",
    },
    link: {
      color: theme.colors.primary,
      ...theme.typography.small,
      fontWeight: "700",
    },
  });
}
