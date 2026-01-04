import React from "react";
import { SafeAreaView, View, StyleSheet } from "react-native";
import { theme } from "../theme";

export function Screen({ children, style }) {
  return (
    <SafeAreaView style={[styles.safe, style]}>
      <View style={styles.inner}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  inner: {
    flex: 1,
  },
});
