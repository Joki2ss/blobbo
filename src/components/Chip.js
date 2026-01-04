import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../theme";

export function Chip({ label, tone = "default" }) {
  return (
    <View style={[styles.base, toneStyles[tone] || toneStyles.default]}>
      <Text style={[styles.text, toneText[tone] || toneText.default]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    alignSelf: "flex-start",
  },
  text: {
    ...theme.typography.small,
  },
});

const toneStyles = {
  default: { backgroundColor: theme.colors.chipBg },
  success: { backgroundColor: "#ECFDF5" },
  warning: { backgroundColor: "#FFFBEB" },
  danger: { backgroundColor: "#FEF2F2" },
};

const toneText = {
  default: { color: theme.colors.chipText },
  success: { color: theme.colors.success },
  warning: { color: theme.colors.warning },
  danger: { color: theme.colors.danger },
};
