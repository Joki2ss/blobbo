import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { TextField } from "../../components/TextField";
import { Button } from "../../components/Button";
import { useTheme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";
import { MiniBarChart } from "../../support/SupportUI/MiniBarChart";
import { aggregateCharts, searchLogs } from "../../support/SupportSearch";
import { listAllLogs } from "../../support/SupportService";
import { isDeveloperUser } from "../../support/SupportPermissions";
import { getSupportRuntimeConfig } from "../../config/supportFlags";
import { listDocumentMetadataForDeveloper } from "../../documents/DocumentsService";

export function DeveloperAuditScreen({ navigation }) {
  const { workspace, developerUnlocked, backendMode, session } = useAppState();
  const actions = useAppActions();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const user = session?.user;
  const isDevEmail = isDeveloperUser(user);

  const [logs, setLogs] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [severity, setSeverity] = useState("All");
  const [userIdFilter, setUserIdFilter] = useState("");

  const cfg = useMemo(() => getSupportRuntimeConfig({ backendMode }), [backendMode]);
  const [docOwnerUserId, setDocOwnerUserId] = useState("");
  const [docMeta, setDocMeta] = useState([]);

  const subtitle = useMemo(() => {
    return workspace?.name ? `Workspace: ${workspace.name}` : "";
  }, [workspace?.name]);

  async function refresh() {
    if (!workspace?.id) return;
    const list = await actions.safeCall(() => listAllLogs({ backendMode, sessionUser: user }), { title: "Support" });
    if (list) setLogs(list);
  }

  async function refreshDocMeta() {
    const ownerId = docOwnerUserId.trim();
    if (!ownerId) return;
    const list = await actions.safeCall(
      () => listDocumentMetadataForDeveloper({ backendMode, sessionUser: user, ownerUserId: ownerId }),
      { title: "Documents" }
    );
    if (Array.isArray(list)) setDocMeta(list);
  }

  useEffect(() => {
    if (developerUnlocked) refresh();
  }, [developerUnlocked, workspace?.id, backendMode]);

  if (!isDevEmail) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Support & logs</Text>
          <Text style={styles.muted}>Forbidden (developer allowlist required).</Text>
          <Button title="Back" variant="secondary" onPress={() => navigation.goBack()} />
        </ScrollView>
      </Screen>
    );
  }

  if (!developerUnlocked) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Support & logs</Text>
          <Text style={styles.muted}>Developer session inactive (code + TTL required).</Text>
          <Card style={styles.card}>
            <Button title="Unlock developer tools" onPress={() => navigation.navigate("DeveloperUnlock")} />
          </Card>
          <Button title="Back" variant="secondary" onPress={() => navigation.goBack()} />
        </ScrollView>
      </Screen>
    );
  }

  const filtered = useMemo(() => {
    return searchLogs({
      logs,
      query,
      category,
      severity,
      actorUserId: userIdFilter.trim() || undefined,
    });
  }, [logs, query, category, severity, userIdFilter]);

  const charts = useMemo(() => aggregateCharts(filtered), [filtered]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Support & logs</Text>
        {subtitle ? <Text style={styles.muted}>{subtitle}</Text> : null}

        <Card style={styles.card}>
          <Button title="Refresh" variant="secondary" onPress={refresh} />
        </Card>

        {cfg.DOCUMENT_EDITOR_ENABLED ? (
          <Card style={styles.card}>
            <Text style={styles.h}>Documents (metadata)</Text>
            <Text style={styles.muted}>Requires support consent for that user (TECH scope).</Text>
            <TextField label="Owner userId" value={docOwnerUserId} onChangeText={setDocOwnerUserId} placeholder="userId" />
            <Button title="Load document metadata" variant="secondary" onPress={refreshDocMeta} />
            {docMeta.length === 0 ? (
              <Text style={styles.muted}>No documents (or consent not granted).</Text>
            ) : (
              docMeta.slice(0, 50).map((d) => (
                <Card key={d.documentId} style={{ marginTop: theme.spacing.sm }}>
                  <Text style={styles.h}>{d.title}</Text>
                  <Text style={styles.muted}>v{d.version} • {d.updatedAt}</Text>
                  <Text style={styles.muted}>{d.documentId}</Text>
                </Card>
              ))
            )}
          </Card>
        ) : null}

        <Card style={styles.card}>
          <TextField label="Search" value={query} onChangeText={setQuery} placeholder="Search logs" />

          <Text style={styles.muted}>Category</Text>
          <View style={styles.pillsRow}>
            {[
              "All",
              "Security",
              "Technical",
              "Payment",
            ].map((c) => (
              <Button
                key={c}
                title={c}
                variant={category === c ? "primary" : "secondary"}
                onPress={() => setCategory(c)}
              />
            ))}
          </View>

          <Text style={styles.muted}>Severity</Text>
          <View style={styles.pillsRow}>
            {[
              "All",
              "INFO",
              "WARN",
              "HIGH",
              "CRITICAL",
            ].map((s) => (
              <Button
                key={s}
                title={s}
                variant={severity === s ? "primary" : "secondary"}
                onPress={() => setSeverity(s)}
              />
            ))}
          </View>

          <TextField
            label="User filter (requires consent for that user)"
            value={userIdFilter}
            onChangeText={setUserIdFilter}
            placeholder="userId"
          />
        </Card>

        <Card style={styles.card}>
          <MiniBarChart title="Events by category" data={charts.byCategory} />
          <MiniBarChart title="Severity distribution" data={charts.bySeverity} />
        </Card>

        {filtered.length === 0 ? (
          <Card style={styles.card}><Text style={styles.muted}>No logs (or consent not granted for user filter).</Text></Card>
        ) : (
          filtered.slice(0, 200).map((l) => (
            <Card key={l.id} style={styles.card}>
              <Text style={styles.h}>{l.category} • {l.subCategory} • {l.severity}</Text>
              <Text style={styles.muted}>{l.timestamp}</Text>
              <Text style={styles.muted}>Actor: {l.actorUserId || "-"} • Target: {l.targetUserId || "-"}</Text>
              <Text style={styles.msg}>{l.message}</Text>
            </Card>
          ))
        )}

        <Button title="Back" variant="secondary" onPress={() => navigation.goBack()} />
      </ScrollView>
    </Screen>
  );
}


function makeStyles(theme) {
  return StyleSheet.create({
    content: {
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
    },
    title: {
      ...theme.typography.h2,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    card: {
      marginBottom: theme.spacing.md,
    },
    h: {
      ...theme.typography.h3,
      color: theme.colors.text,
    },
    msg: {
      marginTop: theme.spacing.sm,
      ...theme.typography.body,
      color: theme.colors.text,
    },
    muted: {
      ...theme.typography.small,
      color: theme.colors.mutedText,
      marginTop: 4,
    },
    pillsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
  });
}
