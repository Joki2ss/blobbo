import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Screen } from "../../components/Screen";
import { Header } from "../../components/Header";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { useTheme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";
import { formatStorefrontAddress } from "../../storefront/storefrontValidation";

export function PublicStorefrontScreen({ navigation, route }) {
  const { backendMode } = useAppState();
  const actions = useAppActions();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const userId = route?.params?.userId || "";

  const [item, setItem] = useState(null);

  async function refresh() {
    const res = await actions.safeCall(
      () => actions.backend.users.getPublicStorefrontById({ userId }),
      { title: "Storefront" }
    );
    if (res) setItem(res);
  }

  useEffect(() => {
    refresh();
  }, [backendMode, userId]);

  const title = item?.storefrontBusinessName || item?.fullName || "Storefront";

  return (
    <Screen>
      <Header title={title} subtitle={item?.storefrontCategory || ""} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.section}>Address</Text>
          <Text style={styles.muted}>{formatStorefrontAddress(item)}</Text>

          {item?.storefrontVatNumber ? (
            <>
              <View style={{ height: theme.spacing.md }} />
              <Text style={styles.section}>VAT</Text>
              <Text style={styles.muted}>{item.storefrontVatNumber}</Text>
            </>
          ) : null}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.section}>Booking</Text>
          <Text style={styles.muted}>Booking options can be attached to posts or to this profile (coming next).</Text>
        </Card>

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
    section: {
      ...theme.typography.h3,
      color: theme.colors.text,
    },
    muted: {
      ...theme.typography.small,
      color: theme.colors.mutedText,
      marginTop: 6,
    },
  });
}
