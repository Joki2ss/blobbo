import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View, Alert } from "react-native";

import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { TextField } from "../../components/TextField";
import { Button } from "../../components/Button";
import { ListRow } from "../../components/ListRow";
import { theme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";
import { getSupportRuntimeConfig } from "../../config/supportFlags";
import { createDocument, deleteDocument, listDocumentsForOwner } from "../../documents/DocumentsService";
import { isAdminOrBusiness } from "../../utils/roles";

export function DocumentsListScreen({ navigation }) {
  const { session, backendMode } = useAppState();
  const actions = useAppActions();
  const user = session?.user;
  const cfg = useMemo(() => getSupportRuntimeConfig({ backendMode }), [backendMode]);

  const [docs, setDocs] = useState([]);
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("note");

  const canUse = isAdminOrBusiness(user?.role);

  async function refresh() {
    if (!cfg.DOCUMENT_EDITOR_ENABLED) return;
    const list = await actions.safeCall(() => listDocumentsForOwner({ backendMode, sessionUser: user }), { title: "Documents" });
    if (list) setDocs(list);
  }

  useEffect(() => {
    refresh();
  }, [backendMode, user?.id]);

  async function create() {
    const t = title.trim() || "Untitled document";
    const doc = await actions.safeCall(() => createDocument({ backendMode, sessionUser: user, title: t, docType }), { title: "Documents" });
    if (doc) {
      setTitle("");
      refresh();
      navigation.navigate("DocumentEditor", { documentId: doc.documentId });
    }
  }

  async function confirmDelete(documentId) {
    Alert.alert("Delete", "Delete this document?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const ok = await actions.safeCall(() => deleteDocument({ backendMode, sessionUser: user, documentId }), { title: "Documents" });
          if (ok) refresh();
        },
      },
    ]);
  }

  if (!cfg.DOCUMENT_EDITOR_ENABLED) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Documents</Text>
          <Text style={styles.muted}>Document editor is disabled in this mode.</Text>
          <Button title="Back" variant="secondary" onPress={() => navigation.goBack()} />
        </ScrollView>
      </Screen>
    );
  }

  if (!canUse) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Documents</Text>
          <Text style={styles.muted}>Only admin/business accounts can use the document editor.</Text>
          <Button title="Back" variant="secondary" onPress={() => navigation.goBack()} />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Documents</Text>
        <Text style={styles.muted}>Private documents (owner-only).</Text>

        <Card style={styles.card}>
          <Text style={styles.h}>Create document</Text>
          <Text style={styles.muted}>Type</Text>
          <View style={styles.typeRow}>
            <Button title="Note" variant={docType === "note" ? "primary" : "secondary"} onPress={() => setDocType("note")} />
            <Button title="Quote" variant={docType === "quote" ? "primary" : "secondary"} onPress={() => setDocType("quote")} />
            <Button title="Contract" variant={docType === "contract" ? "primary" : "secondary"} onPress={() => setDocType("contract")} />
          </View>
          <TextField label="Title" value={title} onChangeText={setTitle} placeholder="Document title" />
          <Button title="Create" onPress={create} />
          <View style={{ height: theme.spacing.sm }} />
          <Button title="Refresh" variant="secondary" onPress={refresh} />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.h}>My documents</Text>
          {docs.length === 0 ? (
            <Text style={styles.muted}>No documents yet.</Text>
          ) : (
            docs.map((d) => (
              <ListRow
                key={d.documentId}
                title={d.title}
                subtitle={`v${d.version} • ${d.updatedAt}`}
                onPress={() => navigation.navigate("DocumentEditor", { documentId: d.documentId })}
                onLongPress={() => confirmDelete(d.documentId)}
              />
            ))
          )}
          <Text style={styles.muted}>Long-press a document to delete.</Text>
        </Card>

        <Button title="Back" variant="secondary" onPress={() => navigation.goBack()} />
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
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  muted: {
    ...theme.typography.small,
    color: theme.colors.mutedText,
    marginTop: 6,
  },
  card: {
    marginTop: theme.spacing.md,
  },
  h: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
});
