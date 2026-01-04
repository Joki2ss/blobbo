import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View, Switch } from "react-native";
import * as DocumentPicker from "expo-document-picker";

import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { TextField } from "../../components/TextField";
import { Button } from "../../components/Button";
import { theme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";
import { getSupportRuntimeConfig } from "../../config/supportFlags";
import {
  attachFileToTicket,
  getTicketById,
  listRelatedLogsForTicketDeveloper,
  postSupportMessage,
  setTicketConsent,
  setTicketStatusByDeveloper,
} from "../../support/SupportTicketsService";
import { isDeveloperUser } from "../../support/SupportPermissions";

export function SupportTicketDetailScreen({ navigation, route }) {
  const { session, backendMode, developerUnlocked } = useAppState();
  const actions = useAppActions();
  const user = session?.user;
  const cfg = useMemo(() => getSupportRuntimeConfig({ backendMode }), [backendMode]);
  const isDevEmail = useMemo(() => isDeveloperUser(user), [user?.email]);

  const ticketId = route?.params?.ticketId;

  const [ticket, setTicket] = useState(null);
  const [message, setMessage] = useState("");
  const [relatedLogs, setRelatedLogs] = useState([]);

  const isOwner = ticket?.createdByUserId && user?.id === ticket.createdByUserId;

  async function refresh() {
    if (!cfg.SUPPORT_TICKETS_ENABLED) return;
    const t = await actions.safeCall(() => getTicketById({ backendMode, sessionUser: user, ticketId }), { title: "Ticket" });
    if (t) setTicket(t);

    if (t && developerUnlocked && isDevEmail) {
      const logs = await actions.safeCall(
        () => listRelatedLogsForTicketDeveloper({ backendMode, sessionUser: user, ticketId }),
        { title: "Logs" }
      );
      if (Array.isArray(logs)) setRelatedLogs(logs);
    } else {
      setRelatedLogs([]);
    }
  }

  useEffect(() => {
    refresh();
  }, [backendMode, user?.id, ticketId]);

  async function send() {
    const ok = await actions.safeCall(
      () => postSupportMessage({ backendMode, sessionUser: user, ticketId, body: message }),
      { title: "Ticket" }
    );
    if (ok) {
      setMessage("");
      refresh();
    }
  }

  const consent = ticket?.consentState;
  const consentEnabled = !!consent?.consentGiven;
  const showRelatedLogs = developerUnlocked && isDevEmail;

  const attachmentsById = useMemo(() => {
    const map = {};
    const list = Array.isArray(ticket?.attachments) ? ticket.attachments : [];
    for (const a of list) {
      map[a.attachmentId] = a;
    }
    return map;
  }, [ticket?.attachments?.length]);

  useEffect(() => {
    if (!showRelatedLogs) return;
    if (backendMode !== "MOCK") return;

    const id = setInterval(() => {
      refresh();
    }, 2500);

    return () => clearInterval(id);
  }, [showRelatedLogs, backendMode, ticketId]);

  async function attach() {
    const res = await actions.safeCall(
      async () => {
        const pick = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
        if (pick.canceled) return null;
        const file = pick.assets && pick.assets[0] ? pick.assets[0] : null;
        if (!file?.uri) return null;
        return attachFileToTicket({ backendMode, sessionUser: user, ticketId, file });
      },
      { title: "Attachment" }
    );
    if (res) refresh();
  }

  async function setStatus(next) {
    await actions.safeCall(
      () => setTicketStatusByDeveloper({ backendMode, sessionUser: user, ticketId, status: next }),
      { title: "Status" }
    );
    refresh();
  }

  const [scopeSecurity, setScopeSecurity] = useState(true);
  const [scopeTech, setScopeTech] = useState(true);
  const [scopePayment, setScopePayment] = useState(false);

  useEffect(() => {
    if (!consent) return;
    const scopes = Array.isArray(consent.scopes) ? consent.scopes : [];
    setScopeSecurity(scopes.includes("SECURITY_LOGS"));
    setScopeTech(scopes.includes("TECH_LOGS"));
    setScopePayment(scopes.includes("PAYMENT_LOGS"));
  }, [consent?.timestamp]);

  async function toggleConsent(next) {
    if (!isOwner) return;

    const scopes = [
      scopeSecurity ? "SECURITY_LOGS" : null,
      scopeTech ? "TECH_LOGS" : null,
      scopePayment ? "PAYMENT_LOGS" : null,
    ].filter(Boolean);

    await actions.safeCall(
      () => setTicketConsent({ backendMode, sessionUser: user, ticketId, consentGiven: next, scopes }),
      { title: "Consent" }
    );
    refresh();
  }

  if (!cfg.SUPPORT_TICKETS_ENABLED) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Ticket</Text>
          <Text style={styles.muted}>Support tickets are disabled in this mode.</Text>
          <Button title="Back" variant="secondary" onPress={() => navigation.goBack()} />
        </ScrollView>
      </Screen>
    );
  }

  if (!ticket) return <Screen />;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{ticket.subject}</Text>
        <Text style={styles.muted}>{ticket.category} • {ticket.status}</Text>

        <Card style={styles.card}>
          <Text style={styles.h}>Consent (per ticket)</Text>
          <Text style={styles.muted}>Allows developer to correlate logs with THIS ticket. Read-only.</Text>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Consent enabled</Text>
            <Switch value={consentEnabled} onValueChange={toggleConsent} disabled={!isOwner} />
          </View>

          <Text style={styles.label}>Scopes</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Security logs</Text>
            <Switch value={scopeSecurity} onValueChange={setScopeSecurity} disabled={!isOwner || consentEnabled} />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Technical logs</Text>
            <Switch value={scopeTech} onValueChange={setScopeTech} disabled={!isOwner || consentEnabled} />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Payment logs</Text>
            <Switch value={scopePayment} onValueChange={setScopePayment} disabled={!isOwner || consentEnabled} />
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.h}>Chat</Text>
          {showRelatedLogs ? (
            <View style={styles.rowButtons}>
              <Button title="OPEN" variant={ticket.status === "OPEN" ? "primary" : "secondary"} onPress={() => setStatus("OPEN")} />
              <Button
                title="IN_PROGRESS"
                variant={ticket.status === "IN_PROGRESS" ? "primary" : "secondary"}
                onPress={() => setStatus("IN_PROGRESS")}
              />
              <Button title="CLOSED" variant={ticket.status === "CLOSED" ? "primary" : "secondary"} onPress={() => setStatus("CLOSED")} />
            </View>
          ) : null}

          {ticket.messages.map((m) => (
            <View key={m.messageId} style={styles.msgRow}>
              <Text style={styles.msgMeta}>{m.senderRole} • {m.createdAt}</Text>
              {m.messageType === "FILE" ? (
                <Text style={styles.msgBody}>
                  FILE: {m.body}
                  {m.attachmentId && attachmentsById[m.attachmentId]?.mimeType ? ` (${attachmentsById[m.attachmentId].mimeType})` : ""}
                </Text>
              ) : (
                <Text style={styles.msgBody}>{m.body}</Text>
              )}
            </View>
          ))}

          <View style={{ height: theme.spacing.md }} />
          <TextField label="Message" value={message} onChangeText={setMessage} placeholder="Type a message" multiline />
          <Button title="Send" onPress={send} disabled={!message.trim()} />
          <View style={{ height: theme.spacing.sm }} />
          <Button title="Attach file" variant="secondary" onPress={attach} />
          <View style={{ height: theme.spacing.sm }} />
          <Button title="Refresh" variant="secondary" onPress={refresh} />
        </Card>

        {showRelatedLogs ? (
          <Card style={styles.card}>
            <Text style={styles.h}>Related logs</Text>
            {!consentEnabled ? (
              <Text style={styles.muted}>Ticket consent not granted.</Text>
            ) : relatedLogs.length === 0 ? (
              <Text style={styles.muted}>No related logs found for this ticket.</Text>
            ) : (
              relatedLogs.slice(0, 50).map((l) => (
                <View key={l.id} style={styles.msgRow}>
                  <Text style={styles.msgMeta}>{l.category} • {l.severity} • {l.timestamp}</Text>
                  <Text style={styles.msgBody}>{l.message}</Text>
                </View>
              ))
            )}
            {consentEnabled ? (
              <>
                <View style={{ height: theme.spacing.sm }} />
                <Button title="Refresh logs" variant="secondary" onPress={refresh} />
              </>
            ) : null}
          </Card>
        ) : null}

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
  label: {
    ...theme.typography.small,
    color: theme.colors.mutedText,
    marginBottom: theme.spacing.sm,
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
  msgRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  msgMeta: {
    ...theme.typography.small,
    color: theme.colors.mutedText,
  },
  msgBody: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginTop: 6,
  },
  rowButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
});
