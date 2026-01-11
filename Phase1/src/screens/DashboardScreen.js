import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../styles/useTheme";

export default function DashboardScreen() {
  const theme = useTheme();
  const styles = makeStyles(theme);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Welcome to your workspace.</Text>
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.background,
      padding: 24,
    },
    title: {
      fontSize: 22,
      fontWeight: "bold",
      marginBottom: 12,
      color: theme.colors.text,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
  });
}
