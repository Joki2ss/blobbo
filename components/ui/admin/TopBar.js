import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
export default function TopBar({ guest, customer, pro, onMenu }) {
  return (
    <View style={{ height: 64, flexDirection: "row", alignItems: "center", backgroundColor: "#181C1F", paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: "#23272A" }}>
      <TouchableOpacity onPress={onMenu}><Ionicons name="menu-outline" size={28} color="#fff" /></TouchableOpacity>
      <Text style={{ flex: 1, textAlign: "left", fontWeight: "bold", fontSize: 22, color: "#fff", marginLeft: 16 }}>Dashboard</Text>
      <TouchableOpacity style={{ marginRight: 16 }}><Ionicons name="notifications-outline" size={24} color="#fff" /></TouchableOpacity>
      <TouchableOpacity>
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#444", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#fff", fontWeight: "bold" }}>U</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
