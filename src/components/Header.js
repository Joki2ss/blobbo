import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../theme";

export function Header({ title, subtitle, right }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: {
    flex: 1,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
  },
  subtitle: {
    ...theme.typography.small,
    color: theme.colors.mutedText,
    marginTop: 4,
  },
  right: {
    marginLeft: theme.spacing.md,
  },
});
