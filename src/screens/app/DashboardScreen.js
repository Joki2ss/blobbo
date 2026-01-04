import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, ScrollView, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../../components/Screen";
import { Header } from "../../components/Header";
import { KpiCard } from "../../components/KpiCard";
import { Card } from "../../components/Card";
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
      let pendingDocs = 0;
      if (clients) {
        for (const c of clients) {
          const docs = await actions.backend.documents.listForClient({ workspaceId: workspace.id, clientId: c.id });
          pendingDocs += docs.filter((d) => d.status !== "completed").length;
        }
      }

      const unreadMessages = (threads || []).reduce((sum, t) => sum + (t.unreadCount || 0), 0);

      if (mounted) {
        setKpis({
          activeClients: clients?.length || 0,
          pendingDocs,
          unreadMessages,
        });
      }
    })();
    return () => {
      mounted = false;
    };
  }, [workspace?.id, backendMode]);

  return (
    <Screen>
      <Header title="SXR Managements" subtitle={subtitle} />
      <ScrollView contentContainerStyle={styles.content}>
        {metaLine ? (
          <Card style={styles.metaCard}>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{metaLine}</Text>
            </View>
          </Card>
        ) : null}
        <View style={styles.kpiRow}>
          <KpiCard
            label="Active clients"
            value={kpis.activeClients}
            icon={<Ionicons name="people-outline" size={20} color={theme.colors.primary} />}
          />
          <View style={{ width: theme.spacing.md }} />
          <KpiCard
            label="Pending docs"
            value={kpis.pendingDocs}
            icon={<Ionicons name="document-text-outline" size={20} color={theme.colors.warning} />}
          />
        </View>

        <View style={styles.kpiRow}>
          <KpiCard
            label="Unread messages"
            value={kpis.unreadMessages}
            icon={<Ionicons name="chatbubbles-outline" size={20} color={theme.colors.danger} />}
          />
          <View style={{ width: theme.spacing.md }} />
          <Card style={styles.cardMini}>
            <Button title="Ask support" onPress={() => navigation.navigate("Support")} />
          </Card>
        </View>

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
