import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../../components/Screen";
import { Header } from "../../components/Header";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { useTheme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";
import { cloudAdminGetPremiumFeature } from "../../services/cloudUpgradesService";
import { openPlayStoreListing } from "../../utils/playStore";

function isAdminRole(role) {
  return String(role || "").toUpperCase() === "ADMIN";
}

export function AdminUpgradeDetailScreen({ route }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const { session, backendMode } = useAppState();
  const actions = useAppActions();
  const user = session?.user;

  const isAdmin = isAdminRole(user?.role);
  const featureId = route?.params?.featureId;

  const [item, setItem] = useState(null);

  useEffect(() => {
    (async () => {
      if (!isAdmin || !featureId) return;
      const row = await actions.safeCall(() => cloudAdminGetPremiumFeature({ featureId }), { title: "Feature" });
      if (row) setItem(row);
    })();
  }, [isAdmin, featureId, backendMode]);

  if (!isAdmin) {
    return (
      <Screen>
        <Header title="Feature" subtitle="Admin only" />
        <View style={styles.content}>
          <Card>
            <Text style={styles.muted}>You are not authorized to view this page.</Text>
          </Card>
        </View>
      </Screen>
    );
  }

  if (!item) {
    return (
      <Screen>
        <Header title="Feature" subtitle="Loading" />
        <View style={styles.content}>
          <Card>
            <Text style={styles.muted}>Loading…</Text>
          </Card>
        </View>
      </Screen>
    );
  }

  const canBuy = item.availabilityStatus === "available" && item.enabled;
  const ctaTitle = item.availabilityStatus === "coming_soon" ? "Coming soon" : item.enabled ? "Buy" : "Not enabled";

  return (
    <Screen>
      <Header title={item.name} subtitle={item.priceLabel} />
      <View style={styles.content}>
        <Card style={styles.card}>
          <View style={styles.iconRow}>
            <Ionicons name={item.icon || "sparkles-outline"} size={22} color={theme.colors.mutedText} />
            <Text style={styles.status}>{item.availabilityStatus === "coming_soon" ? "Coming soon" : item.enabled ? "Enabled" : "Disabled"}</Text>
          </View>
          <Text style={styles.long}>{item.longDescription}</Text>

          <View style={{ height: theme.spacing.md }} />
          <Button
            title={ctaTitle}
            variant={canBuy ? "primary" : "secondary"}
            onPress={() => {
              if (!canBuy) return;
              Alert.alert(
                "Redirect",
                "You will be redirected to Google Play Store to complete the purchase.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Continue",
                    onPress: async () => {
                      await openPlayStoreListing();
                    },
                  },
                ],
                { cancelable: true }
              );
            }}
          />
          <Text style={styles.note}>Purchases do not unlock features client-side. Enablement is controlled by backend flags only.</Text>
        </Card>
      </View>
    </Screen>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    content: {
      padding: theme.spacing.lg,
      flex: 1,
    },
    card: {
      marginBottom: theme.spacing.md,
    },
    iconRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: theme.spacing.sm,
    },
    status: {
      ...theme.typography.small,
      color: theme.colors.mutedText,
      fontWeight: "700",
    },
    long: {
      ...theme.typography.body,
      color: theme.colors.text,
    },
    muted: {
      ...theme.typography.small,
      color: theme.colors.mutedText,
    },
    note: {
      ...theme.typography.small,
      color: theme.colors.mutedText,
      marginTop: theme.spacing.sm,
    },
  });
}
