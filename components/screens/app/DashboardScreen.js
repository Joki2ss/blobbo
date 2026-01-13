
import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export function DashboardScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  // MOCK KPI (solo quelli già esistenti, NO analytics)
  const kpis = [
    { label: "Active clients", value: 12, icon: "people-outline", color: "#2563EB" },
    { label: "Pending docs", value: 3, icon: "document-text-outline", color: "#D97706" },
    { label: "Unread messages", value: 7, icon: "chatbubbles-outline", color: "#DC2626" },
    { label: "Support", value: "?", icon: "help-circle-outline", color: "#2563EB" },
  ];

  return (
    <View style={styles.root}>
      {/* TopBar */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Dashboard</Text>
        <TouchableOpacity><Ionicons name="notifications-outline" size={24} color="#fff" /></TouchableOpacity>
        <View style={styles.avatar}><Text style={{ color: "#fff" }}>U</Text></View>
      </View>
      <View style={styles.row}>
        {/* Sidebar */}
        <View style={styles.sidebar}>
          {kpis.map((kpi) => (
            <TouchableOpacity key={kpi.label} style={styles.sidebarItem}>
              <Ionicons name={kpi.icon} size={24} color={kpi.color} />
              <Text style={styles.sidebarLabel}>{kpi.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Main dashboard */}
        <ScrollView contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}>
          <Text style={styles.sectionHeader}>Workspace</Text>
          <View style={styles.cardGroup}>
            <View style={styles.metaCard}>
              <Text style={styles.meta}>Demo Workspace • ADMIN • MOCK</Text>
            </View>
          </View>
          <Text style={styles.sectionHeader}>Overview</Text>
          <View style={[styles.kpiGrid, isDesktop && styles.kpiGridDesktop]}>
            {kpis.map((kpi) => (
              <View key={kpi.label} style={styles.kpiCard}>
                <Ionicons name={kpi.icon} size={32} color={kpi.color} />
                <Text style={styles.kpiLabel}>{kpi.label}</Text>
                <Text style={styles.kpiValue}>{kpi.value}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.sectionHeader}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionText}>Add client</Text></TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionText}>New document</Text></TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionText}>Open support</Text></TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F6F7FB" },
  topBar: { height: 64, flexDirection: "row", alignItems: "center", backgroundColor: "#181C1F", paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: "#23272A" },
  topBarTitle: { flex: 1, color: "#fff", fontWeight: "bold", fontSize: 22 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#444", alignItems: "center", justifyContent: "center", marginLeft: 16 },
  row: { flex: 1, flexDirection: "row" },
  sidebar: { width: 110, backgroundColor: "#23272A", paddingVertical: 24, alignItems: "center" },
  sidebarItem: { alignItems: "center", marginBottom: 32 },
  sidebarLabel: { color: "#fff", fontSize: 12, marginTop: 4 },
  content: { flexGrow: 1, padding: 24 },
  contentDesktop: { maxWidth: 900, alignSelf: "center" },
  sectionHeader: { color: "#64748B", fontWeight: "bold", fontSize: 16, marginTop: 24, marginBottom: 12, letterSpacing: 0.5 },
  cardGroup: { marginBottom: 16 },
  metaCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 8, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  meta: { color: "#64748B", fontSize: 14 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: 24 },
  kpiGridDesktop: { justifyContent: "flex-start" },
  kpiCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16, alignItems: "center", width: 140, margin: 8, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  kpiLabel: { color: "#64748B", fontSize: 13, marginTop: 8 },
  kpiValue: { color: "#2563EB", fontWeight: "bold", fontSize: 20, marginTop: 4 },
  actionsRow: { flexDirection: "row", justifyContent: "center", gap: 16, marginTop: 24 },
  actionBtn: { backgroundColor: "#2563EB", borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12, marginHorizontal: 8 },
  actionText: { color: "#fff", fontWeight: "bold" },
});
