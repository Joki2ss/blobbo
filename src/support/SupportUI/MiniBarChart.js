import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../theme";

export function MiniBarChart({ title, data }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const entries = Object.entries(data || {});
  const max = Math.max(1, ...entries.map(([, v]) => Number(v) || 0));

  return (
    <View style={styles.wrap}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {entries.length === 0 ? (
        <Text style={styles.muted}>No data</Text>
      ) : (
        entries.map(([k, v]) => {
          const n = Number(v) || 0;
          const w = `${Math.round((n / max) * 100)}%`;
          return (
            <View key={k} style={styles.row}>
              <Text style={styles.label} numberOfLines={1}>
                {k}
              </Text>
              <View style={styles.barBg}>
                <View style={[styles.barFg, { width: w }]} />
              </View>
              <Text style={styles.value}>{n}</Text>
            </View>
          );
        })
      )}
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    wrap: {
      marginTop: theme.spacing.sm,
    },
    title: {
      ...theme.typography.h3,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    muted: {
      ...theme.typography.small,
      color: theme.colors.mutedText,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
      gap: theme.spacing.sm,
    },
    label: {
      ...theme.typography.small,
      color: theme.colors.mutedText,
      width: 86,
    },
    barBg: {
      flex: 1,
      height: 10,
      backgroundColor: theme.colors.bg,
      borderRadius: 999,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    barFg: {
      height: 10,
      backgroundColor: theme.colors.primary,
    },
    value: {
      ...theme.typography.small,
      color: theme.colors.text,
      width: 34,
      textAlign: "right",
    },
  });
}
