
import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, ScrollView, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../../components/Screen";
import PageHeader from "../../ui/admin/PageHeader";
import AdminCard from "../../ui/admin/AdminCard";
import { KpiCard } from "../../components/KpiCard";
import { Button } from "../../components/Button";
import { useTheme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";
import { formatGreeting } from "../../utils/greeting";
import { t } from "../../i18n/strings";

export function DashboardScreen({ navigation }) {
  const { session, workspace, backendMode } = useAppState();
  const actions = useAppActions();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [kpis, setKpis] = useState({ activeClients: 0, pendingDocs: 0, unreadMessages: 0 });

  const subtitle = useMemo(() => {
    if (!session?.user) return "";
    const greeting = formatGreeting({ user: session.user });
    return greeting || t("dashboard.subtitle");
  }, [session, workspace, backendMode]);

  const metaLine = useMemo(() => {
    if (!session?.user || !workspace) return "";
    return `${workspace.name} • ${session.user.role} • ${backendMode}`;
  }, [session?.user?.id, workspace?.id, backendMode]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!workspace) return;
      const clients = await actions.safeCall(() => actions.backend.clients.list({ workspaceId: workspace.id }), { title: "Load failed" });
      const threads = await actions.safeCall(() => actions.backend.chat.listThreads({ workspaceId: workspace.id }), { title: "Load failed" });
      if (!mounted) return;
      setKpis({
        activeClients: clients?.length || 0,
        pendingDocs: 0, // TODO: implement logic for pending docs
        unreadMessages: threads?.reduce((acc, t) => acc + (t.unreadCount || 0), 0) || 0,
      });
    })();
    return () => { mounted = false; };
  }, [workspace, actions]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        {metaLine ? (
          <AdminCard>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{metaLine}</Text>
            </View>
          </AdminCard>
        ) : null}
        {/* KPI grid */}
        <View style={styles.kpiGrid}>
          <KpiCard
            label="Active clients"
            value={kpis.activeClients}
            icon={<Ionicons name="people-outline" size={24} color={theme.colors.primary} />} />
          <KpiCard
            label="Pending docs"
            value={kpis.pendingDocs}
            icon={<Ionicons name="document-text-outline" size={24} color={theme.colors.warning} />} />
        </View>
        <View style={styles.kpiGrid}>
          <KpiCard
            label="Unread messages"
            value={kpis.unreadMessages}
            icon={<Ionicons name="chatbubbles-outline" size={24} color={theme.colors.danger} />} />
          <KpiCard
            label="Support"
            value={"?"}
            icon={<Ionicons name="help-circle-outline" size={24} color={theme.colors.primary} />} />
        </View>
        {/* Azioni rapide */}
        <View style={styles.actionsRow}>
          <Button title="Add client" onPress={() => navigation.navigate("NewClient")} />
          <View style={{ width: theme.spacing.md }} />
          <Button title="New document request" variant="secondary" onPress={() => navigation.navigate("NewDocumentRequest")} />
          <View style={{ width: theme.spacing.md }} />
          <Button title="Open support" variant="secondary" onPress={() => navigation.navigate("Support")} />
        </View>
      </ScrollView>
    </Screen>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    content: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: theme.spacing.md,
    },
    metaText: {
      color: theme.colors.text,
      fontSize: 14,
    },
    kpiGrid: {
      flexDirection: "row",
      alignItems: "stretch",
      justifyContent: "space-between",
      marginBottom: theme.spacing.md,
      gap: theme.spacing.md,
    },
    actionsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
      gap: theme.spacing.md,
    },
  });
}
