import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Switch, Alert, Platform, Linking } from "react-native";
import * as MailComposer from "expo-mail-composer";
import * as Location from "expo-location";
import * as Device from "expo-device";
import Constants from "expo-constants";
import * as Localization from "expo-localization";
import * as Network from "expo-network";

import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { TextField } from "../../components/TextField";
import { Button } from "../../components/Button";
import { theme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";
import { SUPPORT_EMAIL } from "../../config/support";
import { getRecentLogs, logEvent } from "../../services/logger";

const PRIORITIES = ["Low", "Normal", "High"];

export function SupportScreen({ navigation }) {
  const { session, workspace, backendMode, currentScreen, selectedClientId } = useAppState();
  const actions = useAppActions();

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priorityIndex, setPriorityIndex] = useState(1);
  const priority = PRIORITIES[priorityIndex];

  const [includeLocation, setIncludeLocation] = useState(true);
  const [includeDiagnostics, setIncludeDiagnostics] = useState(false);
  const [sending, setSending] = useState(false);

  const canSend = useMemo(() => subject.trim() && description.trim(), [subject, description]);

  const emailSubject = useMemo(() => {
    const wid = workspace?.id || "no-workspace";
    return `[SXR SUPPORT] [${wid}] [${priority}]`;
  }, [workspace?.id, priority]);

  async function buildReport() {
    const user = session?.user;

    let locationBlock = "Location not requested";
    if (includeLocation) {
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status !== "granted") {
          locationBlock = "Location not provided (permission denied)";
        } else {
          const pos = await Location.getCurrentPositionAsync({});
          locationBlock = JSON.stringify(
            {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            },
            null,
            2
          );
        }
      } catch (e) {
        locationBlock = `Location not provided (${e?.message || "error"})`;
      }
    } else {
      locationBlock = "Location not provided (disabled by user)";
    }

    let diagnosticsBlock = "Diagnostics not included";
    if (includeDiagnostics) {
      const netState = await Network.getNetworkStateAsync();
      const logs = getRecentLogs();
      diagnosticsBlock = JSON.stringify(
        {
          network: {
            isConnected: netState.isConnected,
            isInternetReachable: netState.isInternetReachable,
            type: netState.type,
          },
          timestamp: new Date().toISOString(),
          recentLogs: logs.map((l) => ({ createdAt: l.createdAt, type: l.type, details: l.details })),
        },
        null,
        2
      );
    }

    const appName = "SXR Managements";
    const appVersion =
      (Constants.expoConfig && Constants.expoConfig.version) ||
      (Constants.manifest && Constants.manifest.version) ||
      "unknown";

    const deviceModel = Device.modelName || "unknown";
    const osVersion = Platform.Version;

    const report = [
      `Subject: ${subject.trim()}`,
      `Priority: ${priority}`,
      "",
      description.trim(),
      "",
      "---",
      "1) USER IDENTITY",
      JSON.stringify(
        {
          userId: user?.id || "unknown",
          role: user?.role || "unknown",
          fullName: user?.fullName || "unknown",
          email: user?.email || "unknown",
          phone: user?.phone || "",
          workspaceId: workspace?.id || "unknown",
          workspaceName: workspace?.name || "unknown",
        },
        null,
        2
      ),
      "",
      "2) APP & DEVICE",
      JSON.stringify(
        {
          appName,
          appVersion,
          platform: Platform.OS,
          deviceModel,
          osVersion,
          locale: Localization.locale,
          timezone: Localization.timezone,
        },
        null,
        2
      ),
      "",
      "3) SESSION CONTEXT",
      JSON.stringify(
        {
          currentScreen: currentScreen || "unknown",
          selectedClient: selectedClientId || "none",
          backendMode,
        },
        null,
        2
      ),
      "",
      "4) GEOLOCATION (OPTIONAL)",
      locationBlock,
      "",
      "5) TECHNICAL DIAGNOSTICS (OPTIONAL)",
      diagnosticsBlock,
      "",
      "---",
      "No passwords, tokens, or secrets are included.",
    ].join("\n");

    return report;
  }

  async function sendEmail() {
    if (!canSend) return;
    setSending(true);

    logEvent("support_submit", { includeLocation, includeDiagnostics, priority });

    const body = await buildReport();

    const ok = await actions.safeCall(async () => {
      const available = await MailComposer.isAvailableAsync();
      if (available) {
        const res = await MailComposer.composeAsync({
          recipients: [SUPPORT_EMAIL],
          subject: emailSubject,
          body,
        });
        return res.status !== "cancelled";
      }

      const url = `mailto:${encodeURIComponent(SUPPORT_EMAIL)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(body)}`;
      const can = await Linking.canOpenURL(url);
      if (!can) throw new Error("No email client available");
      await Linking.openURL(url);
      return true;
    }, { title: "Support" });

    setSending(false);

    if (ok) {
      Alert.alert("Sent", "Your support request is ready in your email client.");
      navigation.goBack();
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Ask for support</Text>
        <Text style={styles.subtitle}>Sends a plain-text email to {SUPPORT_EMAIL}</Text>

        <Card style={styles.card}>
          <TextField label="Subject (required)" value={subject} onChangeText={setSubject} placeholder="Short summary" />
          <TextField
            label="Description (required)"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the issue and steps to reproduce"
            multiline
          />

          <Text style={styles.label}>Priority</Text>
          <View style={styles.row}>
            {PRIORITIES.map((p, idx) => (
              <View key={p} style={styles.priorityWrap}>
                <Button
                  title={p}
                  variant={priorityIndex === idx ? "primary" : "secondary"}
                  onPress={() => setPriorityIndex(idx)}
                />
              </View>
            ))}
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Include approximate location</Text>
            <Switch value={includeLocation} onValueChange={setIncludeLocation} />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Include technical diagnostics</Text>
            <Switch value={includeDiagnostics} onValueChange={setIncludeDiagnostics} />
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.previewTitle}>Preview</Text>
          <Text style={styles.muted}>{emailSubject}</Text>
          <Text style={styles.previewBody} numberOfLines={10}>
            {description.trim() || "(description will appear here)"}
          </Text>
        </Card>

        <Button title="Send" onPress={sendEmail} disabled={!canSend} loading={sending} />
        <View style={{ height: theme.spacing.md }} />
        <Button title="Cancel" variant="secondary" onPress={() => navigation.goBack()} />
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
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.small,
    color: theme.colors.mutedText,
    marginBottom: theme.spacing.sm,
  },
  row: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    flexWrap: "wrap",
    marginBottom: theme.spacing.md,
  },
  priorityWrap: {
    flexGrow: 1,
    flexBasis: "30%",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  switchLabel: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  previewTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  muted: {
    ...theme.typography.small,
    color: theme.colors.mutedText,
    marginTop: 6,
  },
  previewBody: {
    marginTop: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.text,
  },
});
