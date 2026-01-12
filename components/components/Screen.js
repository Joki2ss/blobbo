import React, { useMemo } from "react";
import { SafeAreaView, View, StyleSheet } from "react-native";
import { useTheme } from "../theme";

export function Screen({ children, style }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <SafeAreaView style={[styles.safe, style]}>
      <View style={styles.inner}>{children}</View>
    </SafeAreaView>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: theme.colors.bg,
    },
    inner: {
      flex: 1,
    },
  });
}
