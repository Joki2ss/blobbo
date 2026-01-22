import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, ScrollView, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../../components/Screen";
import PageHeader from "../../ui/admin/PageHeader";
import AdminCard from "../../ui/admin/AdminCard";
import AdminTable from "../../ui/admin/AdminTable";
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

      // pending docs: count requests with pending/partial
      return (
        <Screen>
          <PageHeader title="Dashboard" action={<Button title="Add client" onPress={() => navigation.navigate("NewClient")} />} />
          <ScrollView contentContainerStyle={styles.content}>
            {metaLine ? (
              <AdminCard>
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>{metaLine}</Text>
                </View>
              </AdminCard>
            ) : null}
            <View style={styles.kpiRow}>
              <KpiCard
                label="Active clients"
                value={kpis.activeClients}
                icon={<Ionicons name="people-outline" size={20} color={theme.colors.primary} />} />
              <View style={{ width: theme.spacing.md }} />
              <KpiCard
                label="Pending docs"
                value={kpis.pendingDocs}
                icon={<Ionicons name="document-text-outline" size={20} color={theme.colors.warning} />} />
            </View>

            <View style={styles.kpiRow}>
              <>
                <KpiCard
                  label="Unread messages"
                  value={kpis.unreadMessages}
                  icon={<Ionicons name="chatbubbles-outline" size={20} color={theme.colors.danger} />} />
                <View style={{ width: theme.spacing.md }} />
                <AdminCard>
                  <Button title="Ask support" onPress={() => navigation.navigate("Support")} />
                </AdminCard>
              </>
            </View>

            <AdminCard>
              <View style={styles.actionsCol}>
                <Button title="Add client" onPress={() => navigation.navigate("NewClient")} />
                <View style={{ height: theme.spacing.md }} />
                <Button
                  title="New document request"
                  variant="secondary"
                  onPress={() => navigation.navigate("NewDocumentRequest")} />
                <View style={{ height: theme.spacing.md }} />
                <Button title="Open support" variant="secondary" onPress={() => navigation.navigate("Support")} />
              </View>
            </AdminCard>
          </ScrollView>
        </Screen>
      );
      <>
        <KpiCard
          label="Unread messages"
          value={kpis.unreadMessages}
          icon={<Ionicons name="chatbubbles-outline" size={20} color={theme.colors.danger} />}
        />
        <View style={{ width: theme.spacing.md }} />
        <Card style={styles.cardMini}>
          <Button title="Ask support" onPress={() => navigation.navigate("Support")} />
        </Card>
      </>
      <Card>
        <View style={styles.actionsCol}>
          <Button title="Add client" onPress={() => navigation.navigate("NewClient")} />
          <View style={{ height: theme.spacing.md }} />
          <Button
            title="New document request"
            variant="secondary"
            onPress={() => navigation.navigate("NewDocumentRequest")}
          />
          <View style={{ height: theme.spacing.md }} />
          <Button title="Open support" variant="secondary" onPress={() => navigation.navigate("Support")} />
        </View>
      </Card>
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
    metaCard: {
      marginBottom: theme.spacing.md,
    },
    metaRow: {
      paddingVertical: theme.spacing.sm,
    },
    metaText: {
      ...theme.typography.small,
      color: theme.colors.mutedText,
    },
    kpiRow: {
      flexDirection: "row",
      marginBottom: theme.spacing.md,
    },
    cardMini: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    actionsCol: {
      paddingVertical: theme.spacing.sm,
    },
  });
}
