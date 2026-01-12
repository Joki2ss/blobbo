// ChatSelection component — Patch (D) SXR Managements UI refresh
import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { colors, spacing, radius, typography } from "../theme/tokens";

export function ChatSelection({
  title,
  subtitle,
  selected,
  onPress,
  unreadCount,
}: {
  title: string;
  subtitle?: string;
  selected?: boolean;
  onPress: () => void;
  unreadCount?: number;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        selected && styles.selected,
        pressed ? { opacity: 0.85 } : null,
      ]}
      onPress={onPress}
    >
      <View style={styles.texts}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {unreadCount ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    marginBottom: spacing.xs,
  },
  selected: {
    backgroundColor: colors.accent + "22",
  },
  texts: {
    flex: 1,
  },
  title: {
    ...typography.body,
    color: colors.text,
  },
  subtitle: {
    ...typography.small,
    color: colors.mutedText,
    marginTop: 2,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    ...typography.small,
    color: "#fff",
    fontWeight: "700",
  },
});
