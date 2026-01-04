import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { theme } from "../theme";

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  multiline,
  right,
  editable = true,
  keyboardType,
  autoCapitalize,
}) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.mutedText}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          editable={editable}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={[styles.input, multiline ? styles.multiline : null, !editable ? styles.disabled : null]}
        />
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.small,
    color: theme.colors.mutedText,
    marginBottom: theme.spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
  },
  input: {
    flex: 1,
    height: 44,
    color: theme.colors.text,
    ...theme.typography.body,
  },
  multiline: {
    height: 110,
    paddingTop: theme.spacing.md,
    textAlignVertical: "top",
  },
  right: {
    marginLeft: theme.spacing.sm,
  },
  disabled: {
    opacity: 0.65,
  },
});
