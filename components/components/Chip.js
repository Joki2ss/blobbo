import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme";

export function Chip({ label, tone = "default" }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const toneStyles = useMemo(() => makeToneStyles(theme), [theme]);
  const toneText = useMemo(() => makeToneText(theme), [theme]);
  return (
    <View style={[styles.base, toneStyles[tone] || toneStyles.default]}>
      <Text style={[styles.text, toneText[tone] || toneText.default]}>{label}</Text>
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
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
}

function makeToneStyles(theme) {
  return {
    default: { backgroundColor: theme.colors.chipBg },
    success: { backgroundColor: theme.colors.chipBg },
    warning: { backgroundColor: theme.colors.chipBg },
    danger: { backgroundColor: theme.colors.chipBg },
  };
}

function makeToneText(theme) {
  return {
    default: { color: theme.colors.chipText },
    success: { color: theme.colors.success },
    warning: { color: theme.colors.warning },
    danger: { color: theme.colors.danger },
  };
}
