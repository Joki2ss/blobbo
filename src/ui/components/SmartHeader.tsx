// SmartHeader component — Patch (B) SXR Managements UI refresh
import React, { useRef, useState } from "react";
import { Animated, View, StyleSheet, Platform } from "react-native";
import { Header } from "../../components/Header";

/**
 * SmartHeader wraps Header and hides/shows on scroll.
 * Usage: Place inside a parent with a ScrollView, pass scrollY Animated.Value.
 */
export function SmartHeader({
  title,
  subtitle,
  right,
  scrollY,
  minY = 0,
  maxY = 80,
  style,
}) {
  // scrollY: Animated.Value (from parent ScrollView)
  // minY: scroll offset to start hiding
  // maxY: scroll offset to fully hide
  const translateY = scrollY
    ? scrollY.interpolate({
        inputRange: [minY, maxY],
        outputRange: [0, -maxY],
        extrapolate: "clamp",
      })
    : 0;

  return (
    <Animated.View
      style={[styles.animated, { transform: [{ translateY }] }, style]}
    >
      <Header title={title} subtitle={subtitle} right={right} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animated: {
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { height: 2, width: 0 },
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
});
