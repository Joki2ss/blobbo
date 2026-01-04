import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";

import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { TextField } from "../../components/TextField";
import { Button } from "../../components/Button";
import { theme } from "../../theme";
import { useAppActions } from "../../store/AppStore";

export function LoginScreen({ navigation }) {
  const actions = useAppActions();
  const [email, setEmail] = useState("admin@acme.com");
  const [password, setPassword] = useState("password");
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    setLoading(true);
    await actions.safeCall(async () => {
      await actions.login({ email, password });
    }, { title: "Login failed" });
    setLoading(false);
  }

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.brand}>SXR Managements</Text>
        <Text style={styles.subtitle}>Multi-tenant client management</Text>

        <Card style={styles.card}>
          <TextField label="Email" value={email} onChangeText={setEmail} placeholder="you@company.com" />
          <TextField label="Password" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
          <Button title="Login" onPress={onLogin} loading={loading} />

          <View style={styles.links}>
            <Pressable onPress={() => navigation.navigate("ForgotPassword")}>
              <Text style={styles.link}>Forgot password?</Text>
            </Pressable>
            <Pressable onPress={() => navigation.navigate("Register")}>
              <Text style={styles.link}>Create account</Text>
            </Pressable>
          </View>

          <Text style={styles.hint}>Demo: admin@acme.com / password</Text>
        </Card>

        <Text style={styles.copyright}>© SM Industries (/ NeoGrafiks) 2026</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xl,
  },
  brand: {
    ...theme.typography.h1,
    textAlign: "center",
    color: theme.colors.text,
  },
  subtitle: {
    ...theme.typography.small,
    textAlign: "center",
    color: theme.colors.mutedText,
    marginTop: 6,
    marginBottom: theme.spacing.lg,
  },
  card: {
    padding: theme.spacing.xl,
  },
  links: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: theme.spacing.md,
  },
  link: {
    color: theme.colors.primary,
    ...theme.typography.small,
    fontWeight: "700",
  },
  hint: {
    marginTop: theme.spacing.md,
    color: theme.colors.mutedText,
    ...theme.typography.small,
    textAlign: "center",
  },
  copyright: {
    marginTop: theme.spacing.xl,
    color: theme.colors.mutedText,
    ...theme.typography.small,
    textAlign: "center",
  },
});
