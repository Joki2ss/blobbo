

import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, TextInput, FlatList, Keyboard, Platform, Modal, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// navigation prop sarà passato da React Navigation

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F6F7FB" },
  topBar: { height: 64, flexDirection: "row", alignItems: "center", backgroundColor: "#181C1F", paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: "#23272A" },
  brandArea: { flexDirection: "row", alignItems: "center", minWidth: 180 },
  brandText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  searchBar: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 8, marginHorizontal: 32, paddingHorizontal: 16, height: 38, position: "relative" },
  searchInput: { flex: 1, color: "#181C1F", fontSize: 15, paddingVertical: 0, backgroundColor: "transparent" },
  searchDropdown: { position: "absolute", top: 44, left: 0, right: 0, backgroundColor: "#fff", borderRadius: 8, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, elevation: 4, zIndex: 10, paddingVertical: 8, maxHeight: 260 },
  searchSectionHeader: { color: "#64748B", fontWeight: "bold", fontSize: 13, paddingHorizontal: 16, paddingVertical: 4, backgroundColor: "#F3F4F6" },
  searchSuggestion: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 16 },
  searchSuggestionText: { color: "#181C1F", fontSize: 15, marginLeft: 10 },
  searchSuggestionActive: { backgroundColor: "#F1F5F9" },
  topBarRight: { flexDirection: "row", alignItems: "center" },
  topBarIcon: { marginHorizontal: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#444", alignItems: "center", justifyContent: "center", marginLeft: 8 },
  row: { flex: 1, flexDirection: "row" },
  sidebar: { width: 120, backgroundColor: "#F3F4F6", paddingVertical: 24, alignItems: "center", borderRightWidth: 1, borderRightColor: "#E5E7EB" },
  hamburger: { marginLeft: 18, marginRight: 8, padding: 8, borderRadius: 8, backgroundColor: "#23272A" },
  mobileSidebarModal: { flex: 1, backgroundColor: "rgba(0,0,0,0.18)", justifyContent: "flex-start" },
  mobileSidebar: { width: 220, backgroundColor: "#F3F4F6", paddingVertical: 32, paddingHorizontal: 12, borderRightWidth: 1, borderRightColor: "#E5E7EB", height: "100%" },
  mobileSidebarClose: { position: "absolute", top: 18, right: 12, zIndex: 2 },
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


export function DashboardScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  // Predictive search state
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState({ section: 0, index: 0 });

  // Sidebar mobile state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Mocked grouped suggestions (replace with real data as needed)
  const searchSuggestions = [
    {
      section: "Clients",
      data: [
        { label: "Mario Rossi", icon: "person-outline", onPress: () => navigation.navigate("ClientsScreen") },
        { label: "Giulia Bianchi", icon: "person-outline", onPress: () => navigation.navigate("ClientsScreen") },
      ],
    },
    {
      section: "Documents",
      data: [
        { label: "Contratto 2024.pdf", icon: "document-text-outline", onPress: () => navigation.navigate("DocumentsListScreen") },
        { label: "Fattura Marzo.docx", icon: "document-text-outline", onPress: () => navigation.navigate("DocumentsListScreen") },
      ],
    },
    {
      section: "Support",
      data: [
        { label: "Apri ticket", icon: "help-circle-outline", onPress: () => navigation.navigate("SupportScreen") },
      ],
    },
  ];

  // Filtered suggestions by search
  const filteredSuggestions = search.length > 0
    ? searchSuggestions.map(group => ({
        ...group,
        data: group.data.filter(item => item.label.toLowerCase().includes(search.toLowerCase())),
      })).filter(group => group.data.length > 0)
    : [];

  // Flattened for keyboard navigation
  const flatSuggestions = filteredSuggestions.flatMap((group, sIdx) =>
    group.data.map((item, iIdx) => ({ ...item, section: group.section, sectionIndex: sIdx, itemIndex: iIdx }))
  );

  // Keyboard navigation (up/down/enter)
  const handleKeyDown = (e) => {
    if (!showDropdown || flatSuggestions.length === 0) return;
    if (e.nativeEvent.key === "ArrowDown") {
      e.preventDefault && e.preventDefault();
      let { section, index } = activeSuggestion;
      if (section < filteredSuggestions.length) {
        if (index + 1 < filteredSuggestions[section].data.length) {
          setActiveSuggestion({ section, index: index + 1 });
        } else if (section + 1 < filteredSuggestions.length) {
          setActiveSuggestion({ section: section + 1, index: 0 });
        }
      }
    } else if (e.nativeEvent.key === "ArrowUp") {
      e.preventDefault && e.preventDefault();
      let { section, index } = activeSuggestion;
      if (index > 0) {
        setActiveSuggestion({ section, index: index - 1 });
      } else if (section > 0) {
        setActiveSuggestion({ section: section - 1, index: filteredSuggestions[section - 1].data.length - 1 });
      }
    } else if (e.nativeEvent.key === "Enter") {
      e.preventDefault && e.preventDefault();
      const group = filteredSuggestions[activeSuggestion.section];
      if (group && group.data[activeSuggestion.index]) {
        group.data[activeSuggestion.index].onPress();
        setShowDropdown(false);
        setSearch("");
        setActiveSuggestion({ section: 0, index: 0 });
        Keyboard.dismiss();
      }
    }
  };

  // MOCK KPI (solo quelli già esistenti, NO analytics)
  const kpis = [
    { label: "Active clients", value: 12, icon: "people-outline", color: "#2563EB" },
    { label: "Pending docs", value: 3, icon: "document-text-outline", color: "#D97706" },
    { label: "Unread messages", value: 7, icon: "chatbubbles-outline", color: "#DC2626" },
    { label: "Support", value: "?", icon: "help-circle-outline", color: "#2563EB" },
  ];

  // Sidebar navigation handlers
  const handleSidebarNav = (label) => {
    switch (label) {
      case "Home":
        navigation.navigate("HomeScreen"); break;
      case "Clients":
        navigation.navigate("ClientsScreen"); break;
      case "Docs":
        navigation.navigate("DocumentsListScreen"); break;
      case "Feed":
        navigation.navigate("PublicFeedScreen"); break;
      case "Support":
        navigation.navigate("SupportScreen"); break;
      default:
        break;
    }
  };

  // Quick actions navigation handlers
  const handleAction = (action) => {
    switch (action) {
      case "Add client":
        navigation.navigate("NewClientScreen"); break;
      case "New document":
        navigation.navigate("NewDocumentRequestScreen"); break;
      case "Open support":
        navigation.navigate("SupportScreen"); break;
      default:
        break;
    }
  };

  return (
    <View style={styles.root}>
      {/* TopBar Shopify-like */}
      <View style={styles.topBar}>
        {!isDesktop && (
          <TouchableOpacity style={styles.hamburger} onPress={() => setSidebarOpen(true)} accessibilityLabel="Open menu">
            <Ionicons name="menu-outline" size={26} color="#fff" />
          </TouchableOpacity>
        )}
        <View style={styles.brandArea}>
          <Ionicons name="storefront-outline" size={28} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.brandText}>SXR Managements</Text>
        </View>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#64748B" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#64748B"
            value={search}
            onChangeText={text => {
              setSearch(text);
              setShowDropdown(true);
              setActiveSuggestion({ section: 0, index: 0 });
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 120)}
            onKeyPress={Platform.OS === "web" ? handleKeyDown : undefined}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            accessibilityLabel="Predictive search bar"
          />
          {showDropdown && filteredSuggestions.length > 0 && (
            <View style={styles.searchDropdown}>
              <ScrollView keyboardShouldPersistTaps="handled">
                {filteredSuggestions.map((group, sIdx) => (
                  <View key={group.section}>
                    <Text style={styles.searchSectionHeader}>{group.section}</Text>
                    {group.data.map((item, iIdx) => {
                      const isActive = activeSuggestion.section === sIdx && activeSuggestion.index === iIdx;
                      return (
                        <TouchableOpacity
                          key={item.label}
                          style={[styles.searchSuggestion, isActive && styles.searchSuggestionActive]}
                          onPress={() => {
                            item.onPress();
                            setShowDropdown(false);
                            setSearch("");
                            setActiveSuggestion({ section: 0, index: 0 });
                            Keyboard.dismiss();
                          }}
                          accessibilityRole="button"
                        >
                          <Ionicons name={item.icon} size={18} color="#64748B" />
                          <Text style={styles.searchSuggestionText}>{item.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
        <View style={styles.topBarRight}>
          <TouchableOpacity style={styles.topBarIcon}><Ionicons name="notifications-outline" size={22} color="#fff" /></TouchableOpacity>
          <TouchableOpacity style={styles.topBarIcon}><Ionicons name="help-circle-outline" size={22} color="#fff" /></TouchableOpacity>
          <View style={styles.avatar}><Text style={{ color: "#fff", fontWeight: "bold" }}>U</Text></View>
        </View>
      </View>
      <View style={styles.row}>
        {/* Sidebar Shopify-like */}
        {isDesktop ? (
          <View style={styles.sidebar}>
            {[
              { icon: "home-outline", label: "Home" },
              { icon: "people-outline", label: "Clients" },
              { icon: "document-text-outline", label: "Docs" },
              { icon: "chatbubbles-outline", label: "Feed" },
              { icon: "help-circle-outline", label: "Support" },
            ].map((item) => (
              <TouchableOpacity key={item.label} style={styles.sidebarItem} onPress={() => handleSidebarNav(item.label)}>
                <Ionicons name={item.icon} size={22} color="#23272A" />
                <Text style={styles.sidebarLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Modal
            visible={sidebarOpen}
            animationType="slide"
            transparent
            onRequestClose={() => setSidebarOpen(false)}
          >
            <Pressable style={styles.mobileSidebarModal} onPress={() => setSidebarOpen(false)}>
              <View style={styles.mobileSidebar}>
                <TouchableOpacity style={styles.mobileSidebarClose} onPress={() => setSidebarOpen(false)} accessibilityLabel="Close menu">
                  <Ionicons name="close-outline" size={28} color="#23272A" />
                </TouchableOpacity>
                {[
                  { icon: "home-outline", label: "Home" },
                  { icon: "people-outline", label: "Clients" },
                  { icon: "document-text-outline", label: "Docs" },
                  { icon: "chatbubbles-outline", label: "Feed" },
                  { icon: "help-circle-outline", label: "Support" },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[styles.sidebarItem, { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginBottom: 18 }]}
                    onPress={() => {
                      setSidebarOpen(false);
                      setTimeout(() => handleSidebarNav(item.label), 180);
                    }}
                  >
                    <Ionicons name={item.icon} size={22} color="#23272A" />
                    <Text style={[styles.sidebarLabel, { marginLeft: 14 }]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Pressable>
          </Modal>
        )}
        {/* Main Content */}
        <ScrollView contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}>
          {/* Maxi Card: Workspace + Overview */}
          <View style={[styles.panel, { paddingBottom: 36 }]}> 
            <Text style={styles.sectionHeader}>Workspace</Text>
            <Text style={styles.meta}>Demo Workspace • ADMIN • MOCK</Text>
            <View style={{ height: 18 }} />
            <Text style={[styles.sectionHeader, { marginTop: 0 }]}>Overview</Text>
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
            <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', gap: 12, marginTop: 8 }}>
              <TouchableOpacity
                style={{ backgroundColor: '#2563EB', borderRadius: 16, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
                onPress={() => handleAction("Add client")}
                accessibilityLabel="Add client"
              >
                <Ionicons name="person-add-outline" size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#2563EB', borderRadius: 16, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
                onPress={() => handleAction("New document")}
                accessibilityLabel="New document"
              >
                <Ionicons name="document-text-outline" size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#2563EB', borderRadius: 16, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
                onPress={() => handleAction("Open support")}
                accessibilityLabel="Open support"
              >
                <Ionicons name="help-circle-outline" size={22} color="#fff" />
              </TouchableOpacity>
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
