import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
const items = [
  { icon: "home-outline", label: "Home" },
  { icon: "people-outline", label: "Clienti" },
  { icon: "document-text-outline", label: "Documenti" },
  { icon: "chatbubbles-outline", label: "Messaggi" },
  { icon: "help-circle-outline", label: "Supporto" },
];
export default function SideBar() {
  return (
    <View style={{ width: 90, backgroundColor: "#23272A", paddingVertical: 24, alignItems: "center", flex: 1 }}>
      {items.map((item, i) => (
        <TouchableOpacity key={item.label} style={{ alignItems: "center", marginBottom: 32 }}>
          <Ionicons name={item.icon} size={28} color="#fff" />
          <Text style={{ color: "#fff", fontSize: 12, marginTop: 4 }}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
