import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Card } from "./Card";
import { theme } from "../theme";

export function KpiCard({ label, value, icon }) {
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={styles.textCol}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{String(value)}</Text>
        </View>
        <View style={styles.iconWrap}>{icon}</View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textCol: {
    flex: 1,
  },
  label: {
    ...theme.typography.small,
    color: theme.colors.mutedText,
    marginBottom: 6,
  },
  value: {
    ...theme.typography.h1,
    color: theme.colors.text,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: theme.spacing.md,
  },
});
