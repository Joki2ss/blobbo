import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import { DashboardScreen } from "../../screens/app/DashboardScreen";
import { ClientsScreen } from "../../screens/app/ClientsScreen";
import { ChatScreen } from "../../screens/app/ChatScreen";
import { ActivityScreen } from "../../screens/app/ActivityScreen";
import { SettingsScreen } from "../../screens/app/SettingsScreen";
import { theme } from "../../theme";

const Tab = createBottomTabNavigator();

export function TabNavigator() {
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
        tabBarIcon: ({ color, size }) => {
          const name = iconName(route.name);
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Clients" component={ClientsScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Activity" component={ActivityScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function iconName(routeName) {
  switch (routeName) {
    case "Dashboard":
      return "grid-outline";
    case "Clients":
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
