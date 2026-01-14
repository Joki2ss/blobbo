
import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F6F7FB" },
  topBar: { height: 64, flexDirection: "row", alignItems: "center", backgroundColor: "#181C1F", paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: "#23272A" },
  brandArea: { flexDirection: "row", alignItems: "center", minWidth: 180 },
  brandText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  searchBar: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 8, marginHorizontal: 32, paddingHorizontal: 16, height: 38 },
  searchPlaceholder: { color: "#64748B", fontSize: 15 },
  topBarRight: { flexDirection: "row", alignItems: "center" },
  topBarIcon: { marginHorizontal: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#444", alignItems: "center", justifyContent: "center", marginLeft: 8 },
  row: { flex: 1, flexDirection: "row" },
  sidebar: { width: 120, backgroundColor: "#F3F4F6", paddingVertical: 24, alignItems: "center", borderRightWidth: 1, borderRightColor: "#E5E7EB" },
  sidebarItem: { alignItems: "center", marginBottom: 28, width: "100%" },
  sidebarLabel: { color: "#23272A", fontSize: 13, marginTop: 4, fontWeight: "500" },
  content: { flexGrow: 1, padding: 32, alignItems: "center" },
  contentDesktop: { maxWidth: 900, alignSelf: "center" },
  panel: { backgroundColor: "#fff", borderRadius: 16, padding: 28, marginBottom: 28, width: "100%", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  sectionHeader: { color: "#181C1F", fontWeight: "bold", fontSize: 17, marginBottom: 18, letterSpacing: 0.5 },
  meta: { color: "#64748B", fontSize: 14 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 24, marginBottom: 8 },
  kpiGridDesktop: { justifyContent: "flex-start" },
  kpiCard: { backgroundColor: "#F3F4F6", borderRadius: 12, padding: 20, alignItems: "center", width: 160, margin: 8 },
  kpiLabel: { color: "#64748B", fontSize: 14, marginTop: 8 },
  kpiValue: { color: "#2563EB", fontWeight: "bold", fontSize: 22, marginTop: 4 },
  actionsRow: { flexDirection: "row", justifyContent: "flex-start", gap: 16, marginTop: 8 },
  actionBtn: { backgroundColor: "#2563EB", borderRadius: 24, paddingHorizontal: 22, paddingVertical: 13, marginHorizontal: 4 },
  actionText: { color: "#fff", fontWeight: "bold" },
  rightPanel: { width: 320, backgroundColor: "#F9FAFB", borderLeftWidth: 1, borderLeftColor: "#E5E7EB", padding: 24, alignItems: "center" },
  rightPanelHeader: { color: "#181C1F", fontWeight: "bold", fontSize: 16, marginBottom: 12 },
  rightPanelText: { color: "#64748B", fontSize: 15 },
});

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
      {/* TopBar Shopify-like */}
      <View style={styles.topBar}>
        <View style={styles.brandArea}>
          <Ionicons name="storefront-outline" size={28} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.brandText}>SXR Managements</Text>
        </View>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#64748B" style={{ marginRight: 8 }} />
          <Text style={styles.searchPlaceholder}>Search...</Text>
        </View>
        <View style={styles.topBarRight}>
          <TouchableOpacity style={styles.topBarIcon}><Ionicons name="notifications-outline" size={22} color="#fff" /></TouchableOpacity>
          <TouchableOpacity style={styles.topBarIcon}><Ionicons name="help-circle-outline" size={22} color="#fff" /></TouchableOpacity>
          <View style={styles.avatar}><Text style={{ color: "#fff", fontWeight: "bold" }}>U</Text></View>
        </View>
      </View>
      <View style={styles.row}>
        {/* Sidebar Shopify-like */}
        <View style={styles.sidebar}>
          {[
            { icon: "home-outline", label: "Home" },
            { icon: "people-outline", label: "Clients" },
            { icon: "document-text-outline", label: "Docs" },
            { icon: "chatbubbles-outline", label: "Feed" },
            { icon: "help-circle-outline", label: "Support" },
          ].map((item) => (
            <TouchableOpacity key={item.label} style={styles.sidebarItem}>
              <Ionicons name={item.icon} size={22} color="#23272A" />
              <Text style={styles.sidebarLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Main Content */}
        <ScrollView contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}>
          <View style={styles.panel}>
            <Text style={styles.sectionHeader}>Workspace</Text>
            <Text style={styles.meta}>Demo Workspace • ADMIN • MOCK</Text>
          </View>
          <View style={styles.panel}>
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
          </View>
          <View style={styles.panel}>
            <Text style={styles.sectionHeader}>Quick Actions</Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionText}>Add client</Text></TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionText}>New document</Text></TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionText}>Open support</Text></TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        {/* Optional right panel (Inbox/Assistant) */}
        {isDesktop && (
          <View style={styles.rightPanel}>
            <Text style={styles.rightPanelHeader}>Assistant</Text>
            <Text style={styles.rightPanelText}>How can I help?</Text>
          </View>
        )}
      </View>
    </View>
  );
}
