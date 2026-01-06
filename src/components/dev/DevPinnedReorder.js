import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "../Card";
import { Button } from "../Button";
import { useTheme } from "../../theme";

export function DevPinnedReorder({ pinnedPosts, onMoveUp, onMoveDown }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  if (!Array.isArray(pinnedPosts) || pinnedPosts.length === 0) return null;

  return (
    <Card style={styles.card}>
      <Text style={styles.h}>Pinned ordering</Text>
      <Text style={styles.muted}>Pinned posts appear first (ascending pinnedRank).</Text>
      <View style={{ height: theme.spacing.sm }} />

      {pinnedPosts.map((p, idx) => (
        <View key={p.postId} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{p.title}</Text>
            <Text style={styles.muted}>rank: {p.pinnedRank}</Text>
          </View>
          <Pressable onPress={() => onMoveUp(idx)} style={({ pressed }) => [pressed ? { opacity: 0.9 } : null]}>
            <Button title="Up" variant="secondary" onPress={() => onMoveUp(idx)} />
          </Pressable>
          <View style={{ width: theme.spacing.sm }} />
          <Pressable onPress={() => onMoveDown(idx)} style={({ pressed }) => [pressed ? { opacity: 0.9 } : null]}>
            <Button title="Down" variant="secondary" onPress={() => onMoveDown(idx)} />
          </Pressable>
        </View>
      ))}
    </Card>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    card: {
      marginBottom: theme.spacing.md,
    },
    h: {
      ...theme.typography.h3,
      color: theme.colors.text,
    },
    title: {
      ...theme.typography.h3,
      color: theme.colors.text,
    },
    muted: {
      ...theme.typography.small,
      color: theme.colors.mutedText,
      marginTop: 4,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
  });
}
