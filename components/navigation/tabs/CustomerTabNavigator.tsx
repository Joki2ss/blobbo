// @ts-nocheck
import React, { useMemo } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../theme";
import { PublicFeedLazyScreen } from "../../screens/public";
import { FindAProScreen } from "../../screens/FindAProScreen";
import { ChatScreen } from "../../screens/app/ChatScreen";
import { ProfileScreen } from "../../screens/app/ProfileScreen";
import { SettingsScreen } from "../../screens/app/SettingsScreen";

const Tab = createBottomTabNavigator();

export function CustomerTabNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.mutedText,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const name = iconName(route.name);
          return (
            <Ionicons
              name={name as any}
              size={size}
              color={color}
              style={{
                padding: 6,
                borderRadius: theme.radius.md,
                backgroundColor: focused ? theme.colors.chipBg : "transparent",
              }}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Feed" component={PublicFeedLazyScreen as any} />
      <Tab.Screen name="Search" component={FindAProScreen as any} />
      <Tab.Screen name="Messages" component={ChatScreen as any} />
      <Tab.Screen name="Profile" component={ProfileScreen as any} />
      <Tab.Screen name="Settings" component={SettingsScreen as any} />
    </Tab.Navigator>
  );
}

function iconName(routeName: string) {
  switch (routeName) {
    case "Feed":
      return "compass-outline";
    case "Search":
      return "search-outline";
    case "Messages":
      return "chatbubbles-outline";
    case "Profile":
      return "person-outline";
    case "Settings":
      return "settings-outline";
    default:
      return "ellipse-outline";
  }
}
