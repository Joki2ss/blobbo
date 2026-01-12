import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, RefreshControl, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../../components/Screen";
import { Header } from "../../components/Header";
import { Card } from "../../components/Card";
import { ListRow } from "../../components/ListRow";
import { useTheme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";
import { cloudAdminListPremiumFeatures } from "../../services/cloudUpgradesService";

function isAdminRole(role) {
  return String(role || "").toUpperCase() === "ADMIN";
}

export function AdminUpgradesScreen({ navigation }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const { session, backendMode } = useAppState();
  const actions = useAppActions();
  const user = session?.user;

  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = isAdminRole(user?.role);

  async function load() {
    if (!isAdmin) return;
    const list = await actions.safeCall(() => cloudAdminListPremiumFeatures(), { title: "Extra / Upgrades" });
    if (list) setItems(list);
  }

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [user?.id, backendMode]);

  if (!isAdmin) {
    return (
      <Screen>
        <Header title="Extra / Upgrades" subtitle="Admin only" />
        <View style={styles.content}>
          <Card>
            <Text style={styles.muted}>You are not authorized to view this page.</Text>
          </Card>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Extra / Upgrades" subtitle="Premium features catalog" />
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              try {
                await load();
              } finally {
                setRefreshing(false);
              }
            }}
            tintColor={theme.colors.mutedText}
          />
        }
      >
        {items.length === 0 ? (
          <View style={styles.content}>
            <Card>
              <Text style={styles.muted}>No items available.</Text>
            </Card>
          </View>
        ) : (
          <View style={styles.listWrap}>
            {items.map((it) => {
              const statusText = it.availabilityStatus === "coming_soon" ? "Coming soon" : it.enabled ? "Enabled" : "Disabled";
              return (
                <ListRow
                  key={it.featureId}
                  title={it.name}
                  subtitle={it.shortDescription}
                  icon={<Ionicons name={it.icon || "sparkles-outline"} size={22} color={theme.colors.mutedText} />}
                  badge={<Text style={styles.badgeText}>{statusText}</Text>}
                  onPress={() => navigation.navigate("AdminUpgradeDetail", { featureId: it.featureId })}
                />
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    content: {
      padding: theme.spacing.lg,
    },
    listWrap: {
      backgroundColor: theme.colors.surface,
    },
    muted: {
      ...theme.typography.small,
      color: theme.colors.mutedText,
    },
    badgeText: {
      ...theme.typography.small,
      color: theme.colors.mutedText,
      fontWeight: "700",
    },
  });
}
