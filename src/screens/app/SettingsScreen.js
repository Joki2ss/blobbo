import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";

import { Screen } from "../../components/Screen";
import { Header } from "../../components/Header";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { useTheme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";
import { getSupportRuntimeConfig } from "../../config/supportFlags";
import { isDeveloperUser } from "../../support/SupportPermissions";
import { isAdminOrBusiness } from "../../utils/roles";

export function SettingsScreen({ navigation }) {
  const { session, workspace, backendMode, developerUnlocked, themeMode } = useAppState();
  const actions = useAppActions();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [allowedWorkspaces, setAllowedWorkspaces] = useState([]);

  const subtitle = useMemo(() => {
    if (!workspace) return "";
    return `${workspace.name} • ${backendMode}`;
  }, [workspace, backendMode]);

  const user = session?.user;
  const supportCfg = useMemo(() => getSupportRuntimeConfig({ backendMode }), [backendMode]);
  const isDevEmail = useMemo(() => isDeveloperUser(user), [user?.email]);

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
          <Text style={styles.title}>Appearance</Text>
          <Text style={styles.muted}>Theme (colors only)</Text>

          <View style={styles.row}>
            <Pressable
              onPress={() => actions.setThemeMode("light")}
              style={[styles.pill, themeMode === "light" ? styles.pillActive : null]}
            >
              <Text style={[styles.pillText, themeMode === "light" ? styles.pillTextActive : null]}>LIGHT</Text>
            </Pressable>
            <Pressable
              onPress={() => actions.setThemeMode("dark")}
              style={[styles.pill, themeMode === "dark" ? styles.pillActive : null]}
            >
              <Text style={[styles.pillText, themeMode === "dark" ? styles.pillTextActive : null]}>DARK</Text>
            </Pressable>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.title}>Account</Text>
          <Text style={styles.muted}>{user?.fullName}</Text>
          <Text style={styles.muted}>{user?.email}</Text>
          <Text style={styles.muted}>{user?.role} • {user?.id}</Text>

          <View style={{ height: theme.spacing.md }} />
          <Button title="Profile" variant="secondary" onPress={() => navigation.navigate("Profile")} />

          {supportCfg.DOCUMENT_EDITOR_ENABLED && isAdminOrBusiness(user?.role) ? (
            <>
              <View style={{ height: theme.spacing.sm }} />
              <Button title="Documents" variant="secondary" onPress={() => navigation.navigate("Documents")} />
            </>
          ) : null}
        </Card>

        {isAdminOrBusiness(user?.role) && allowedWorkspaces.length > 1 ? (
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
          {supportCfg.SUPPORT_TICKETS_ENABLED ? (
            <>
              <View style={{ height: theme.spacing.sm }} />
              <Button title="Support tickets" variant="secondary" onPress={() => navigation.navigate("SupportTickets")} />
            </>
          ) : null}
        </Card>

        {isDevEmail ? (
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
        ) : null}

        {isDevEmail ? (
          <Card style={styles.card}>
            <Text style={styles.title}>Developer tools</Text>
            <View style={{ height: theme.spacing.md }} />
            {developerUnlocked ? (
              <>
                <Button title="Support & logs" variant="secondary" onPress={() => navigation.navigate("DeveloperAudit")} />
                <View style={{ height: theme.spacing.sm }} />
                {supportCfg.SUPPORT_TICKETS_ENABLED ? (
                  <>
                    <Button title="Tickets (dev)" variant="secondary" onPress={() => navigation.navigate("DeveloperTickets")} />
                    <View style={{ height: theme.spacing.sm }} />
                  </>
                ) : null}
                <Button title="Lock developer tools" variant="secondary" onPress={() => actions.lockDeveloperTools()} />
              </>
            ) : (
              <Button title="Unlock developer tools" variant="secondary" onPress={() => navigation.navigate("DeveloperUnlock")} />
            )}
            <View style={{ height: theme.spacing.sm }} />
          </Card>
        ) : null}

        <Button title="Logout" variant="secondary" onPress={() => actions.logout()} />

        <Pressable
          onLongPress={() => {
            if (!supportCfg.LONG_PRESS_ENABLED) return;
            if (!isDevEmail) return;
            navigation.navigate("DeveloperUnlock");
          }}
          delayLongPress={900}
        >
          <Text style={styles.footer}>© SM Industries (/ NeoGrafiks) 2026</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
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
    footer: {
      marginTop: theme.spacing.xl,
      ...theme.typography.small,
      color: theme.colors.mutedText,
      textAlign: "center",
    },
  });
}
