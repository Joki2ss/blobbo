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

  // Shopify-style sidebar for desktop: fixed, vertical, enterprise look
  // Responsive: sidebar only on desktop (width >= 1024), tab bar on mobile
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;

  const sidebarStyle = isDesktop
    ? {
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: 240,
        backgroundColor: theme.colors.bg,
        borderRightWidth: 1,
        borderRightColor: theme.colors.border,
        paddingTop: 32,
        paddingBottom: 32,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        boxShadow: '0 0 0 1px ' + theme.colors.border,
      }
    : {};

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.mutedText,
        tabBarStyle: isDesktop
          ? {
              ...sidebarStyle,
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
              backgroundColor: theme.colors.bg,
              borderTopWidth: 0,
              borderRightWidth: 1,
              borderRightColor: theme.colors.border,
              boxShadow: '0 0 0 1px ' + theme.colors.border,
              height: '100vh',
              width: 240,
              position: 'fixed',
              left: 0,
              top: 0,
              flexDirection: 'column',
              paddingTop: 32,
              paddingBottom: 32,
              zIndex: 100,
            }
          : {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
            },
        tabBarIcon: ({ color, size, focused }) => {
          const name = iconName(route.name);
          return (
            <Ionicons
              name={name as any}
              size={22}
              color={color}
              style={{
                marginRight: isDesktop ? 16 : 0,
                marginLeft: isDesktop ? 8 : 0,
                backgroundColor: focused ? theme.colors.chipBg : 'transparent',
                borderRadius: theme.radius.md,
                padding: 6,
              }}
            />
          );
        },
        tabBarLabelStyle: isDesktop
          ? {
              fontSize: 16,
              fontWeight: 500,
              color: theme.colors.text,
              marginLeft: 8,
              textAlign: 'left',
            }
          : {},
        tabBarItemStyle: isDesktop
          ? {
              flexDirection: 'row',
              alignItems: 'center',
              width: '100%',
              borderRadius: theme.radius.md,
              marginBottom: 4,
              marginTop: 4,
              paddingLeft: 16,
              paddingRight: 16,
              height: 48,
              backgroundColor: 'transparent',
            }
          : {},
      })}
    >
      {showFeed ? (
        <Tab.Screen name="Feed" component={PublicFeedLazyScreen as any} />
      ) : null}
      <Tab.Screen name="Dashboard" component={DashboardScreen as any} />
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
