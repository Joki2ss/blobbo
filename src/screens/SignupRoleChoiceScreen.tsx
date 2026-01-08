// @ts-nocheck
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Screen } from "../components/Screen";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { useTheme } from "../theme";

type RoleChoice = "CUSTOMER" | "PRO";

export function SignupRoleChoiceScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [selected, setSelected] = useState<RoleChoice | null>(null);

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>
          Choose the experience that fits you.
        </Text>

        <Pressable
          onPress={() => setSelected("CUSTOMER")}
          style={({ pressed }) => [
            styles.choiceWrap,
            pressed ? { opacity: 0.92 } : null,
          ]}
        >
          <Card
            style={[
              styles.choiceCard,
              selected === "CUSTOMER" ? styles.choiceCardActive : null,
            ]}
          >
            <Text style={styles.choiceTitle}>Customer</Text>
            <Text style={styles.choiceSubtitle}>
              Discover professionals and services
            </Text>
            <Text style={styles.choiceNote}>
              You can upgrade to Pro anytime
            </Text>
          </Card>
        </Pressable>

        <Pressable
          onPress={() => setSelected("PRO")}
          style={({ pressed }) => [
            styles.choiceWrap,
            pressed ? { opacity: 0.92 } : null,
          ]}
        >
          <Card
            style={[
              styles.choiceCard,
              selected === "PRO" ? styles.choiceCardActive : null,
            ]}
          >
            <Text style={styles.choiceTitle}>Pro</Text>
            <Text style={styles.choiceSubtitle}>
              Manage your business and clients
            </Text>
          </Card>
        </Pressable>

        <View style={{ height: theme.spacing.md }} />

        <Button
          title="Continue"
          onPress={() => {
            if (selected === "CUSTOMER") navigation.navigate("CustomerSignup");
            if (selected === "PRO") navigation.navigate("ProSignup");
          }}
          disabled={!selected}
        />

        <View style={styles.bottomRow}>
          <Button
            title="Login"
            variant="secondary"
            onPress={() => navigation.navigate("Login")}
          />
        </View>
      </View>
    </Screen>
  );
}

function makeStyles(theme: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: theme.spacing.xl,
      paddingBottom: theme.spacing.xl,
    },
    title: {
      ...(theme.typography.h1 || {}),
      color: theme.colors.text,
    },
    subtitle: {
      ...(theme.typography.small || {}),
      color: theme.colors.mutedText,
      marginTop: 6,
      marginBottom: theme.spacing.lg,
    },
    choiceWrap: {
      marginBottom: theme.spacing.md,
    },
    choiceCard: {
      padding: theme.spacing.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    choiceCardActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.chipBg,
    },
    choiceTitle: {
      ...(theme.typography.h2 || theme.typography.h1 || {}),
      color: theme.colors.text,
    },
    choiceSubtitle: {
      ...(theme.typography.body || {}),
      color: theme.colors.mutedText,
      marginTop: 6,
    },
    choiceNote: {
      ...(theme.typography.small || {}),
      color: theme.colors.mutedText,
      marginTop: theme.spacing.sm,
    },
    bottomRow: {
      marginTop: theme.spacing.md,
    },
  });
}
