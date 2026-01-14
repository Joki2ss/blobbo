
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";
import { cloudAdminListPremiumFeatures } from "../../services/cloudUpgradesService";

function isAdminRole(role) {
  return String(role || "").toUpperCase() === "ADMIN";
}

export function AdminUpgradesScreen({ navigation }) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const styles = makeStyles(theme);

  const { session, backendMode } = useAppState();
  const actions = useAppActions();
  const user = session?.user;

  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = isAdminRole(user?.role);

  async function load() {
    if (!isAdmin) return;
    const list = await actions.safeCall(() => cloudAdminListPremiumFeatures(), { title: "Extra / Upgrades" });
    if (list) setItems(list);
  }

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [user?.id, backendMode]);

  // --- Shopify-like layout ---
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
            <TouchableOpacity key={item.label} style={styles.sidebarItem} onPress={() => {
              switch (item.label) {
                case "Home": navigation.navigate("HomeScreen"); break;
                case "Clients": navigation.navigate("ClientsScreen"); break;
                case "Docs": navigation.navigate("DocumentsListScreen"); break;
                case "Feed": navigation.navigate("PublicFeedScreen"); break;
                case "Support": navigation.navigate("SupportScreen"); break;
                default: break;
              }
            }}>
              <Ionicons name={item.icon} size={22} color="#23272A" />
              <Text style={styles.sidebarLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Main Content */}
        <ScrollView
          contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                try {
                  await load();
                } finally {
                  setRefreshing(false);
                }
              }}
              tintColor={theme.colors.mutedText}
            />
          }
        >
          <View style={styles.panel}>
            <Text style={styles.sectionHeader}>Extra / Upgrades</Text>
            <Text style={styles.meta}>Premium features catalog</Text>
          </View>
          <View style={styles.panel}>
            {isAdmin ? (
              items.length === 0 ? (
                <Text style={styles.muted}>No items available.</Text>
              ) : (
                <View style={styles.listWrap}>
                  {items.map((it) => {
                    const statusText = it.availabilityStatus === "coming_soon" ? "Coming soon" : it.enabled ? "Enabled" : "Disabled";
                    return (
                      <TouchableOpacity
                        key={it.featureId}
                        style={styles.listRow}
                        onPress={() => navigation.navigate("AdminUpgradeDetail", { featureId: it.featureId })}
                      >
                        <Ionicons name={it.icon || "sparkles-outline"} size={22} color={theme.colors.mutedText} style={{ marginRight: 12 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.listTitle}>{it.name}</Text>
                          <Text style={styles.listSubtitle}>{it.shortDescription}</Text>
                        </View>
                        <Text style={styles.badgeText}>{statusText}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )
            ) : (
              <Text style={styles.muted}>You are not authorized to view this page.</Text>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const makeStyles = (theme) => StyleSheet.create({
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
  listWrap: { width: "100%" },
  listRow: { flexDirection: "row", alignItems: "center", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  listTitle: { color: "#181C1F", fontWeight: "bold", fontSize: 15 },
  listSubtitle: { color: "#64748B", fontSize: 13 },
  muted: { color: "#64748B", fontSize: 14 },
  badgeText: { color: "#64748B", fontWeight: "700", fontSize: 13, marginLeft: 8 },
});
