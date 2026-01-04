import React from "react";
import { Pressable, Text, StyleSheet, ActivityIndicator } from "react-native";
import { theme } from "../theme";

export function Button({ title, onPress, variant = "primary", loading, disabled }) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant] || variantStyles.primary,
        isDisabled && styles.disabled,
        pressed && !isDisabled ? styles.pressed : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? theme.colors.primaryText : theme.colors.primary} />
      ) : (
        <Text style={[styles.text, variantTextStyles[variant] || variantTextStyles.primary]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 46,
    borderRadius: theme.radius.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xl,
  },
  text: {
    ...theme.typography.h3,
  },
  pressed: {
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.55,
  },
});

const variantStyles = {
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  danger: {
    backgroundColor: theme.colors.danger,
  },
};

const variantTextStyles = {
  primary: {
    color: theme.colors.primaryText,
  },
  secondary: {
    color: theme.colors.text,
  },
  danger: {
    color: theme.colors.primaryText,
  },
};
