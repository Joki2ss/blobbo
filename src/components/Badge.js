import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../theme";

export function Badge({ count }) {
  if (!count) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{count > 99 ? "99+" : String(count)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: theme.colors.primaryText,
    fontSize: 12,
    fontWeight: "700",
  },
});
