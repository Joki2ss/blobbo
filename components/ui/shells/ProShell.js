import React from "react";
import { View } from "react-native";
import TopBar from "../admin/TopBar";
import SideBar from "../admin/SideBar";
export default function ProShell({ children }) {
  // Mobile/Expo: layout verticale, niente sidebar fissa
  return (
    <View style={{ flex: 1 }}>
      <TopBar pro />
      <View style={{ flexDirection: "row", flex: 1 }}>
        <SideBar />
        <View style={{ flex: 1 }}>{children}</View>
      </View>
    </View>
  );
}
