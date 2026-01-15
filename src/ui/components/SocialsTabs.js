import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

const TABS = [
  { key: "my", label: "My Posts" },
  { key: "scheduled", label: "Scheduled" },
  { key: "published", label: "Published" },
];

export default function SocialsTabs({ tab, onTabChange, navigation }) {
  return (
    <View style={styles.tabs}>
      {TABS.map(t => (
        <TouchableOpacity
          key={t.key}
          style={[styles.tab, tab === t.key && styles.activeTab]}
          onPress={() => onTabChange && onTabChange(t.key)}
        >
          <Text style={[styles.tabLabel, tab === t.key && styles.activeTabLabel]}>{t.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", backgroundColor: "#F3F4F6", padding: 8, borderRadius: 12, margin: 18 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 8 },
  activeTab: { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
  tabLabel: { color: "#64748B", fontWeight: "500", fontSize: 15 },
  activeTabLabel: { color: "#2563EB", fontWeight: "bold" },
});
