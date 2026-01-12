import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
export default function TopBar({ guest, customer, pro, onMenu }) {
  return (
    <View style={{ height: 56, flexDirection: "row", alignItems: "center", backgroundColor: "#181C1F", paddingHorizontal: 16 }}>
      <TouchableOpacity onPress={onMenu}><Text>☰</Text></TouchableOpacity>
      <Text style={{ flex: 1, textAlign: "center", fontWeight: "bold" }}>Brand</Text>
      <TouchableOpacity><Text>🔔</Text></TouchableOpacity>
      <TouchableOpacity><Text>U</Text></TouchableOpacity>
    </View>
  );
}
