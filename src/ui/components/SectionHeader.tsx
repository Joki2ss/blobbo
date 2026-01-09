// SectionHeader component — Patch (A) SXR Managements UI refresh
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, typography } from "../theme/tokens";

export function SectionHeader({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  return (
    <View style={styles.wrap}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <View style={styles.texts}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  icon: {
    marginRight: spacing.sm,
  },
  texts: {
    flex: 1,
  },
  title: {
    ...typography.section,
    color: colors.text,
  },
  subtitle: {
    ...typography.small,
    color: colors.mutedText,
    marginTop: 2,
  },
});
