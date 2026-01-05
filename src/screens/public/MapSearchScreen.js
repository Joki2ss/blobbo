import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Screen } from "../../components/Screen";
import { Header } from "../../components/Header";
import { Card } from "../../components/Card";
import { TextField } from "../../components/TextField";
import { Button } from "../../components/Button";
import { useTheme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";
import { getSupportRuntimeConfig } from "../../config/supportFlags";
import { formatStorefrontAddress } from "../../storefront/storefrontValidation";

export function MapSearchScreen({ navigation }) {
  const { backendMode } = useAppState();
  const actions = useAppActions();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const cfg = useMemo(() => getSupportRuntimeConfig({ backendMode }), [backendMode]);

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  async function refresh() {
    if (!cfg.PUBLIC_FEED_ENABLED) {
      setItems([]);
      return;
    }

    setLoading(true);
    const list = await actions.safeCall(
      () => actions.backend.users.listPublicStorefronts({ query }),
      { title: "Map" }
    );
    setLoading(false);
    if (Array.isArray(list)) setItems(list);
  }

  useEffect(() => {
    const id = setTimeout(() => {
      refresh();
    }, 250);
    return () => clearTimeout(id);
  }, [backendMode, cfg.PUBLIC_FEED_ENABLED, query]);

  return (
    <Screen>
      <Header title="Map" subtitle="Search public storefronts" />
      <ScrollView contentContainerStyle={styles.content}>
        {!cfg.PUBLIC_FEED_ENABLED ? (
          <Card>
            <Text style={styles.muted}>This feature is disabled in this mode.</Text>
          </Card>
        ) : (
          <>
            <Card style={styles.card}>
              <TextField
                label="Search"
                value={query}
                onChangeText={setQuery}
                placeholder="Business name, category, city..."
              />
              <View style={{ height: theme.spacing.sm }} />
              <Button title={loading ? "Searching..." : "Refresh"} variant="secondary" onPress={refresh} disabled={loading} />
            </Card>

            {items.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.muted}>No public storefronts found.</Text>
              </View>
            ) : (
              items.map((s) => (
                <Card key={s.userId} style={styles.card}>
                  <Text style={styles.h}>{s.storefrontBusinessName || s.fullName || "Storefront"}</Text>
                  <Text style={styles.muted}>{[s.storefrontCategory, formatStorefrontAddress(s)].filter(Boolean).join("\n")}</Text>
                  <View style={{ height: theme.spacing.sm }} />
                  <Button title="Open" onPress={() => navigation.navigate("PublicStorefront", { userId: s.userId })} />
                </Card>
              ))
            )}
          </>
        )}

        <Button title="Back" variant="secondary" onPress={() => navigation.goBack()} />
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
    card: {
      marginBottom: theme.spacing.md,
    },
    h: {
      ...theme.typography.h3,
      color: theme.colors.text,
    },
    muted: {
      ...theme.typography.small,
      color: theme.colors.mutedText,
      marginTop: 6,
    },
    empty: {
      paddingVertical: theme.spacing.xl,
    },
  });
}
