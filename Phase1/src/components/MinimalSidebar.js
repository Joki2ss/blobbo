import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../styles/useTheme";

export default function MinimalSidebar() {
  const theme = useTheme();
  const styles = makeStyles(theme);
  return (
    <View style={styles.sidebar}>
      <Text style={styles.item}>Dashboard</Text>
      <Text style={styles.item}>Feed</Text>
      <Text style={styles.item}>Settings</Text>
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    sidebar: {
      width: 120,
      backgroundColor: theme.colors.card,
      borderRightWidth: 1,
      borderRightColor: theme.colors.border,
      paddingVertical: 24,
      paddingHorizontal: 8,
    },
    item: {
      fontSize: 16,
      color: theme.colors.text,
      marginBottom: 18,
    },
  });
}
