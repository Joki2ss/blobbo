import React, { useMemo } from "react";
import { Pressable, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme";

export function ListRow({ title, subtitle, right, onPress, icon, badge }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}>
      {icon ? (
        <View style={styles.iconWrap}>{icon}</View>
      ) : (
        <View style={styles.iconWrap}>
          <Ionicons name="person-circle-outline" size={24} color={theme.colors.mutedText} />
        </View>
      )}
      <View style={styles.textCol}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {badge ? <View style={styles.badge}>{badge}</View> : null}
        </View>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedText} />}
    </Pressable>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    pressed: {
      opacity: 0.92,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.bg,
      alignItems: "center",
      justifyContent: "center",
      marginRight: theme.spacing.md,
    },
    textCol: {
      flex: 1,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: {
      ...theme.typography.h3,
      color: theme.colors.text,
      flex: 1,
      paddingRight: theme.spacing.sm,
    },
    subtitle: {
      ...theme.typography.small,
      color: theme.colors.mutedText,
      marginTop: 2,
    },
    right: {
      marginLeft: theme.spacing.md,
    },
    badge: {
      marginLeft: theme.spacing.sm,
    },
  });
}
