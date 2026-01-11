import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../styles/useTheme";

export default function PlaceholderCard({ title, description }) {
  const theme = useTheme();
  const styles = makeStyles(theme);
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>{description}</Text>
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.colors.text,
      marginBottom: 4,
    },
    desc: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
  });
}
