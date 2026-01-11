import React from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";

export default function ResponsiveView({ children, style }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  return (
    <View style={[styles.base, isDesktop ? styles.desktop : styles.mobile, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
  },
  desktop: {
    paddingHorizontal: 48,
    paddingVertical: 32,
  },
  mobile: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
