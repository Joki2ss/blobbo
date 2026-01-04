import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";

import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { TextField } from "../../components/TextField";
import { Button } from "../../components/Button";
import { useTheme } from "../../theme";
import { useAppActions } from "../../store/AppStore";
import { t } from "../../i18n/strings";

const BUSINESS_WORKSPACE_ID = "ws_businesscafe";

export function BusinessSignupScreen({ navigation }) {
  const actions = useAppActions();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [firstName, setFirstName] = useState("Giulio");
  const [displayName, setDisplayName] = useState("");
  const [professionalTitle, setProfessionalTitle] = useState("");
  const [email, setEmail] = useState("business@demo.com");
  const [password, setPassword] = useState("password");
  const [loading, setLoading] = useState(false);

  const fullName = useMemo(() => {
    const n = String(displayName || "").trim() || String(firstName || "").trim();
    return n || "Business User";
  }, [displayName, firstName]);

  async function onSignup() {
    setLoading(true);
    await actions.safeCall(async () => {
      await actions.register({
        workspaceId: BUSINESS_WORKSPACE_ID,
        role: "BUSINESS",
        fullName,
        email,
        phone: "",
        password,
        firstName,
        displayName,
        professionalTitle,
      });
    }, { title: t("signup.sxr.title") });
    setLoading(false);
  }

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>{t("signup.sxr.title")}</Text>
        <Text style={styles.subtitle}>{t("signup.sxr.subtitle")}</Text>

        <Card style={styles.card}>
          <TextField label={t("signup.field.firstName")} value={firstName} onChangeText={setFirstName} placeholder="Giulio" />
          <TextField label={t("signup.field.displayName")} value={displayName} onChangeText={setDisplayName} placeholder="Giulio Rossi" />
          <TextField label={t("signup.field.professionalTitle")} value={professionalTitle} onChangeText={setProfessionalTitle} placeholder="Avvocato / Dott." />

          <TextField label={t("signup.field.email")} value={email} onChangeText={setEmail} placeholder="you@company.com" />
          <TextField label={t("signup.field.password")} value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />

          <Button title={t("signup.action.create")} onPress={onSignup} loading={loading} />
          <View style={{ height: theme.spacing.md }} />
          <Button title={t("signup.action.back")} variant="secondary" onPress={() => navigation.goBack()} />

          <Text style={styles.hint}>Mock signup (no email verification).</Text>
        </Card>
      </View>
    </Screen>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: theme.spacing.xl,
    },
    title: {
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
    hint: {
      marginTop: theme.spacing.md,
      color: theme.colors.mutedText,
      ...theme.typography.small,
      textAlign: "center",
    },
  });
}
