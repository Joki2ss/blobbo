// @ts-nocheck
import React, { useMemo } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../theme";
import { useAppState } from "../../store/AppStore";

import { DashboardScreen } from "../../screens/app/DashboardScreen";
import { ClientsScreen } from "../../screens/app/ClientsScreen";
import { ChatScreen } from "../../screens/app/ChatScreen";
import { ActivityScreen } from "../../screens/app/ActivityScreen";
import { SettingsScreen } from "../../screens/app/SettingsScreen";
import { PublicFeedLazyScreen } from "../../screens/public";

const Tab = createBottomTabNavigator();

function normUpper(v: any) {
  return String(v || "")
    .trim()
    .toUpperCase();
}

function toModules(arr: any): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((x) => normUpper(x)).filter(Boolean);
}

export function ProTabNavigator() {
  const theme = useTheme();
  const { session } = useAppState();
  const modules = useMemo(
    () => toModules((session as any)?.user?.enabledModules),
    [session?.user]
  );

  const showFeed =
    modules.includes("FEED_POSTING") ||
    modules.includes("MENU_MEDIA") ||
    modules.length === 0;
  const showChat = modules.includes("SECURE_MESSAGING") || modules.length === 0;
  const showClients =
    modules.includes("DOCUMENT_REQUESTS") ||
    modules.includes("APPOINTMENTS") ||
    modules.length === 0;
  const showActivity = modules.length === 0;

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
      <Tab.Screen name="Dashboard" component={DashboardScreen as any} />
      {showFeed ? (
        <Tab.Screen name="Feed" component={PublicFeedLazyScreen as any} />
      ) : null}
      {showClients ? (
        <Tab.Screen name="Database" component={ClientsScreen as any} />
      ) : null}
      {showChat ? (
        <Tab.Screen name="Chat" component={ChatScreen as any} />
      ) : null}
      {showActivity ? (
        <Tab.Screen name="Activity" component={ActivityScreen as any} />
      ) : null}
      <Tab.Screen name="Settings" component={SettingsScreen as any} />
    </Tab.Navigator>
  );
}

function iconName(routeName: string) {
  switch (routeName) {
    case "Dashboard":
      return "grid-outline";
    case "Feed":
      return "compass-outline";
    case "Database":
      return "people-outline";
    case "Chat":
      return "chatbubbles-outline";
    case "Activity":
      return "time-outline";
    case "Settings":
      return "settings-outline";
    default:
      return "ellipse-outline";
  }
}
