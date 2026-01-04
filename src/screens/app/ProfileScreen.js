import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";

import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { TextField } from "../../components/TextField";
import { Button } from "../../components/Button";
import { theme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";
import { isCustomerOrStaff } from "../../utils/roles";

export function ProfileScreen({ navigation }) {
  const { session, workspace } = useAppState();
  const actions = useAppActions();

  const user = session?.user;

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [photoUri, setPhotoUri] = useState(user?.photoUri || "");

  const [requestedEmail, setRequestedEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const isCustomer = isCustomerOrStaff(user?.role);

  const planLabel = useMemo(() => {
    return isCustomer ? "Customer plan: Lifetime Free" : "Admin account";
  }, [isCustomer]);

  async function saveProfile() {
    if (!workspace?.id || !user?.id) return;
    setSaving(true);

    const updated = await actions.safeCall(
      () => actions.updateMyProfile({ fullName, phone, photoUri }),
      { title: "Profile" }
    );

    setSaving(false);
    if (updated) Alert.alert("Saved", "Profile updated.");
  }

  async function requestEmailChange() {
    if (!workspace?.id || !user?.id) return;
    const next = requestedEmail.trim().toLowerCase();
    if (!next) {
      Alert.alert("Email", "Enter the new email you want to request.");
      return;
    }

    const res = await actions.safeCall(() => actions.requestEmailChange({ requestedEmail: next }), { title: "Request" });

    if (res?.ok) {
      Alert.alert("Requested", "Your request was sent to the admin queue.");
      setRequestedEmail("");
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>{planLabel}</Text>

        <Card style={styles.card}>
          <Text style={styles.section}>Basics</Text>
          <TextField label="Full name" value={fullName} onChangeText={setFullName} placeholder="Full name" />
          <TextField label="Phone" value={phone} onChangeText={setPhone} placeholder="+1 ..." />
          <TextField
            label="Profile photo URL (optional)"
            value={photoUri}
            onChangeText={setPhotoUri}
            placeholder="https://..."
          />

          <TextField
            label="Email (login identifier)"
            value={user?.email || ""}
            onChangeText={() => {}}
            placeholder=""
            editable={false}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {isCustomer ? (
            <Text style={styles.notice}>Email changes require admin approval.</Text>
          ) : (
            <Text style={styles.notice}>Email is a login identifier (locked in this demo).</Text>
          )}

          <Button title="Save" onPress={saveProfile} loading={saving} />
        </Card>

        {isCustomer ? (
          <Card style={styles.card}>
            <Text style={styles.section}>Request email change</Text>
            <TextField label="New email" value={requestedEmail} onChangeText={setRequestedEmail} placeholder="new@email.com" />
            <Button title="Request" variant="secondary" onPress={requestEmailChange} />
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
  section: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  notice: {
    ...theme.typography.small,
    color: theme.colors.mutedText,
    marginBottom: theme.spacing.md,
    marginTop: -4,
  },
});
