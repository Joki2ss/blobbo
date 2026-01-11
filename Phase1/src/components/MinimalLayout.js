import React from "react";
import { View, StyleSheet } from "react-native";
import MinimalHeader from "./MinimalHeader";
import MinimalSidebar from "./MinimalSidebar";
import ResponsiveView from "./ResponsiveView";

export default function MinimalLayout({ children, title }) {
  return (
    <ResponsiveView style={styles.root}>
      <MinimalHeader title={title} />
      <View style={styles.body}>
        <MinimalSidebar />
        <View style={styles.content}>{children}</View>
      </View>
    </ResponsiveView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f6f6f7",
  },
  body: {
    flexDirection: "row",
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
});
