import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "../theme";

export function Card({ children, style }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return <View style={[styles.card, style]}>{children}</View>;
}

function makeStyles(theme) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.lg,
      ...theme.shadows.card,
    },
  });
}
