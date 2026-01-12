import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Card } from "./Card";
import { Button } from "./Button";
import { useTheme } from "../theme";

export function ProPreviewCard({ pro, onViewProfile, variant = "list" }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const tags = Array.isArray(pro?.tags) ? pro.tags.filter(Boolean).slice(0, 3) : [];

  return (
    <Card style={[styles.card, variant === "sheet" ? styles.sheet : null]}>
      <Text style={styles.title}>{pro?.businessName || "Professional"}</Text>
      <Text style={styles.meta}>
        {(pro?.ownerName ? pro.ownerName : "")}
        {(pro?.city || pro?.region) ? ` • ${[pro.city, pro.region].filter(Boolean).join(", ")}` : ""}
      </Text>

      <Text style={styles.muted}>
        {[pro?.category, tags.length ? tags.join(" • ") : ""].filter(Boolean).join(" • ")}
      </Text>

      <View style={{ height: theme.spacing.sm }} />
      <Button title="View profile" onPress={onViewProfile} />
    </Card>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    card: {
      marginBottom: theme.spacing.md,
    },
    sheet: {
      marginBottom: 0,
    },
    title: {
      ...theme.typography.h3,
      color: theme.colors.text,
    },
    meta: {
      ...theme.typography.small,
      color: theme.colors.mutedText,
      marginTop: 6,
    },
    muted: {
      ...theme.typography.small,
      color: theme.colors.mutedText,
      marginTop: 4,
    },
  });
}
