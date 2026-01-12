import React, { useRef, useState } from "react";
import { Animated, View, ScrollView } from "react-native";
import TopBar from "../admin/TopBar";

export default function GuestShell({ children }) {
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(0);
  const threshold = 30;
  const onScroll = (e) => {
    const y = e.nativeEvent.contentOffset.y;
    if (y - lastScrollY.current > threshold) setShowHeader(false);
    else if (lastScrollY.current - y > 20) setShowHeader(true);
    lastScrollY.current = y;
  };
  return (
    <View style={{ flex: 1 }}>
      {showHeader && <TopBar guest />}
      <ScrollView onScroll={onScroll} scrollEventThrottle={16}>
        {children}
      </ScrollView>
    </View>
  );
}
