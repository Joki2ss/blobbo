import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";

import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { TextField } from "../../components/TextField";
import { Button } from "../../components/Button";
import { theme } from "../../theme";
import { useAppActions } from "../../store/AppStore";

export function ForgotPasswordScreen({ navigation }) {
  const actions = useAppActions();
  const [email, setEmail] = useState("admin@acme.com");
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setLoading(true);
    const res = await actions.safeCall(async () => {
      return actions.forgotPassword({ email });
    }, { title: "Request failed" });
    setLoading(false);

    if (res?.ok) Alert.alert("Check your inbox", res.message);
  }

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.subtitle}>Mock flow for demo purposes</Text>

        <Card style={styles.card}>
          <TextField label="Email" value={email} onChangeText={setEmail} placeholder="you@company.com" />
          <Button title="Send reset instructions" onPress={onSubmit} loading={loading} />

          <View style={styles.links}>
            <Pressable onPress={() => navigation.goBack()}>
              <Text style={styles.link}>Back</Text>
            </Pressable>
          </View>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
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
    padding: theme.spacing.xl,
  },
  links: {
    marginTop: theme.spacing.md,
    alignItems: "center",
  },
  link: {
    color: theme.colors.primary,
    ...theme.typography.small,
    fontWeight: "700",
  },
});
