import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";

import { Screen } from "../../components/Screen";
import { Header } from "../../components/Header";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { theme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";

export function SettingsScreen({ navigation }) {
  const { session, workspace, backendMode } = useAppState();
  const actions = useAppActions();

  const [allowedWorkspaces, setAllowedWorkspaces] = useState([]);

  const subtitle = useMemo(() => {
    if (!workspace) return "";
    return `${workspace.name} • ${backendMode}`;
  }, [workspace, backendMode]);

  const user = session?.user;

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user?.id) return;
      const list = await actions.safeCall(
        () => actions.backend.workspaces.listForUser({ userId: user.id }),
        { title: "Workspaces" }
      );
      if (mounted && list) setAllowedWorkspaces(list);
    })();
    return () => {
      mounted = false;
    };
  }, [user?.id, backendMode]);

  return (
    <Screen>
      <Header title="Settings" subtitle={subtitle} />
      <View style={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.title}>Account</Text>
          <Text style={styles.muted}>{user?.fullName}</Text>
          <Text style={styles.muted}>{user?.email}</Text>
          <Text style={styles.muted}>{user?.role} • {user?.id}</Text>
        </Card>

        {user?.role === "ADMIN" && allowedWorkspaces.length > 1 ? (
          <Card style={styles.card}>
            <Text style={styles.title}>Workspace</Text>
            <Text style={styles.muted}>Switch workspace (demo)</Text>

            <View style={styles.row}>
              {allowedWorkspaces.map((w) => (
                <Pressable
                  key={w.id}
                  onPress={async () => {
                    await actions.safeCall(() => actions.switchWorkspace(w.id), { title: "Workspace" });
                  }}
                  style={[styles.pill, workspace?.id === w.id ? styles.pillActive : null]}
                >
                  <Text style={[styles.pillText, workspace?.id === w.id ? styles.pillTextActive : null]}>{w.name}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.muted}>Demo multi-tenant admin: admin@demo.com / password</Text>
          </Card>
        ) : null}

        <Card style={styles.card}>
          <Text style={styles.title}>Support</Text>
          <View style={{ height: theme.spacing.md }} />
          <Button title="Ask for support" onPress={() => navigation.navigate("Support")} />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.title}>Developer mode</Text>
          <Text style={styles.muted}>Backend mode</Text>

          <View style={styles.row}>
            <Pressable
              onPress={() => actions.setBackendMode("MOCK")}
              style={[styles.pill, backendMode === "MOCK" ? styles.pillActive : null]}
            >
              <Text style={[styles.pillText, backendMode === "MOCK" ? styles.pillTextActive : null]}>MOCK</Text>
            </Pressable>
            <Pressable
              onPress={async () => {
                await actions.setBackendMode("CLOUD");
                Alert.alert(
                  "Cloud backend",
                  "Cloud backend is a skeleton. Configure keys in src/config/cloud.js. If not configured, screens will show a friendly error."
                );
              }}
              style={[styles.pill, backendMode === "CLOUD" ? styles.pillActive : null]}
            >
              <Text style={[styles.pillText, backendMode === "CLOUD" ? styles.pillTextActive : null]}>CLOUD</Text>
            </Pressable>
          </View>
        </Card>

        <Button title="Logout" variant="secondary" onPress={() => actions.logout()} />

        <Text style={styles.footer}>© SM Industries (/ NeoGrafiks) 2026</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    flex: 1,
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
  row: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
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
  footer: {
    marginTop: theme.spacing.xl,
    ...theme.typography.small,
    color: theme.colors.mutedText,
    textAlign: "center",
  },
});
