// Button component — Patch (A) SXR Managements UI refresh
import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from "react-native";
import { colors, spacing, radius, typography } from "../theme/tokens";

export function Button({
  title,
  onPress,
  variant = "primary",
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], style]}
      onPress={onPress}
    >
      <Text style={[styles.text, styles[variant + "Text"]]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    marginVertical: spacing.xs,
  },
  primary: {
    backgroundColor: colors.accent,
  },
  secondary: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  danger: {
    backgroundColor: colors.accentAlt,
  },
  text: {
    ...typography.body,
    fontWeight: "700",
  },
  primaryText: {
    color: "#fff",
  },
  secondaryText: {
    color: colors.text,
  },
  dangerText: {
    color: "#fff",
  },
});
