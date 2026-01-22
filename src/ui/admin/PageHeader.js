import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function PageHeader({ title, subtitle, action }) {
  return (
    <View style={styles.header}>
      <View style={styles.titleBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  titleBlock: {
    flexDirection: "column",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 2,
    color: "#23272A",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
  },
});
