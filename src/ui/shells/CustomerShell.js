import React from "react";
import { View } from "react-native";
import TopBar from "../admin/TopBar";
export default function CustomerShell({ children }) {
  return (
    <View style={{ flex: 1 }}>
      <TopBar customer />
      {children}
    </View>
  );
}
