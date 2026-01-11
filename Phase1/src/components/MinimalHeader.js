import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../styles/useTheme";

export default function MinimalHeader({ title }) {
  const theme = useTheme();
  const styles = makeStyles(theme);
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    header: {
      width: "100%",
      paddingVertical: 16,
      paddingHorizontal: 24,
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      alignItems: "flex-start",
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.colors.text,
    },
  });
}
