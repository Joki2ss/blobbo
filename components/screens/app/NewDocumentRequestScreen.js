import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";

import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { TextField } from "../../components/TextField";
import { Button } from "../../components/Button";
import { useTheme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";
import { DOCUMENT_TEMPLATES } from "../../data/templates";

export function NewDocumentRequestScreen({ navigation, route }) {
  const { workspace, backendMode } = useAppState();
  const actions = useAppActions();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const routeClientId = route?.params?.clientId;

  const [clientId, setClientId] = useState(routeClientId || "");
  const [title, setTitle] = useState("Onboarding");
  const [templateId, setTemplateId] = useState("onboarding");
  const [itemsText, setItemsText] = useState("ID / Passport\nProof of Address\nCompany Registration");
  const [loading, setLoading] = useState(false);

  const canCreate = useMemo(() => clientId && title.trim() && itemsText.trim(), [clientId, title, itemsText]);

  async function onCreate() {
    if (!workspace?.id) return;
    setLoading(true);

    const items = itemsText
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);

    const created = await actions.safeCall(
      () => actions.backend.documents.createRequest({ workspaceId: workspace.id, clientId, title: title.trim(), items, templateId }),
      { title: "Create failed" }
    );

    setLoading(false);
    if (created) {
      Alert.alert("Created", "Document request created.");
      navigation.goBack();
    }
  }

  async function pickDocumentMetadata() {
    if (backendMode !== "MOCK") {
      Alert.alert("Cloud mode", "Document upload is prepared for cloud mode (metadata only in MOCK). Add storage integration later.");
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: false, multiple: false });
    if (result.canceled) return;
    const file = result.assets?.[0];
    if (!file) return;

    await actions.safeCall(
      () => actions.backend.documents.addUploadMetadata({
        workspaceId: workspace.id,
        requestId: "(select after create)",
        name: file.name,
        size: file.size,
        mimeType: file.mimeType,
      }),
      { title: "Not available" }
    );

    Alert.alert("Mock", "Upload metadata is stored on a request after you create it (kept minimal for demo)." );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>New document request</Text>
        <Text style={styles.subtitle}>Checklist-based request (no file storage in MOCK)</Text>

        <Card style={styles.card}>
          <Text style={styles.label}>Template</Text>
          <View style={styles.row}>
            {DOCUMENT_TEMPLATES.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => {
                  setTemplateId(t.id);
                  if (t.id !== "custom") {
                    setTitle(t.title);
                    setItemsText(t.items.join("\n"));
                  }
                }}
                style={[styles.pill, templateId === t.id ? styles.pillActive : null]}
              >
                <Text style={[styles.pillText, templateId === t.id ? styles.pillTextActive : null]}>{t.title}</Text>
              </Pressable>
            ))}
          </View>

          <TextField label="Client ID" value={clientId} onChangeText={setClientId} placeholder="Paste clientId (or open from client detail)" />
          <TextField label="Title" value={title} onChangeText={setTitle} placeholder="Request title" />
          <TextField
            label="Checklist (one per line)"
            value={itemsText}
            onChangeText={setItemsText}
            placeholder="Item 1\nItem 2"
            multiline
          />

          <Button title="Create request" onPress={onCreate} disabled={!canCreate} loading={loading} />
          <View style={{ height: theme.spacing.md }} />
          <Button title="Pick document (prepared)" variant="secondary" onPress={pickDocumentMetadata} />
          <View style={{ height: theme.spacing.md }} />
          <Button title="Cancel" variant="secondary" onPress={() => navigation.goBack()} />
        </Card>
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
      marginTop: theme.spacing.sm,
    },
    label: {
      ...theme.typography.small,
      color: theme.colors.mutedText,
      marginBottom: theme.spacing.xs,
    },
    row: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      flexWrap: "wrap",
      marginBottom: theme.spacing.md,
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
  });
}
