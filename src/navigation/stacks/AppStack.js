import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAppState } from "../../store/AppStore";
import { CustomerTabNavigator } from "../tabs/CustomerTabNavigator";
import { ProHomeGateScreen } from "../../screens/app/ProHomeGateScreen";
import { ClientDetailScreen } from "../../screens/app/ClientDetailScreen";
import { ChatThreadScreen } from "../../screens/app/ChatThreadScreen";
import { NewClientScreen } from "../../screens/app/NewClientScreen";
import { NewDocumentRequestScreen } from "../../screens/app/NewDocumentRequestScreen";
import { NewMessageScreen } from "../../screens/app/NewMessageScreen";
import { ProfileScreen } from "../../screens/app/ProfileScreen";
import { SupportScreen } from "../../screens/app/SupportScreen";
import { AdminChangeCustomerEmailScreen } from "../../screens/app/AdminChangeCustomerEmailScreen";
import { AdminUpgradesScreen } from "../../screens/app/AdminUpgradesScreen";
import { AdminUpgradeDetailScreen } from "../../screens/app/AdminUpgradeDetailScreen";
import { DeveloperUnlockScreen } from "../../screens/app/DeveloperUnlockScreen";
import { DeveloperAuditScreen } from "../../screens/app/DeveloperAuditScreen";
import { SupportTicketsListScreen } from "../../screens/app/SupportTicketsListScreen";
import { SupportTicketDetailScreen } from "../../screens/app/SupportTicketDetailScreen";
import { DeveloperTicketsScreen } from "../../screens/app/DeveloperTicketsScreen";
import { DocumentsListScreen } from "../../screens/app/DocumentsListScreen";
import { DocumentEditorLazyScreen } from "../../screens/app/DocumentEditorLazyScreen";
import { FindAProScreen } from "../../screens/FindAProScreen";
import { DevPanelScreen } from "../../screens/DevPanelScreen";
import { isAdminOrBusiness } from "../../utils/roles";
import { isDeveloperUser } from "../../support/SupportPermissions";
import {
  DeveloperFeedControlLazyScreen,
  MapSearchLazyScreen,
  PostEditorLazyScreen,
  PublicFeedLazyScreen,
  PublicStorefrontLazyScreen,
} from "../../screens/public";

const Stack = createNativeStackNavigator();

export function AppStack() {
  const { session } = useAppState();
  const user = session?.user;
  const isDev = isDeveloperUser(user);
  const isPro = isDev || isAdminOrBusiness(user?.role);
  const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN";

  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={isPro ? ProHomeGateScreen : CustomerTabNavigator} options={{ headerShown: false }} />

      {/* Customer-allowed public browsing */}
      <Stack.Screen name="PublicFeed" component={PublicFeedLazyScreen} options={{ title: "Discover" }} />
      <Stack.Screen name="MapSearch" component={MapSearchLazyScreen} options={{ title: "Map" }} />
      <Stack.Screen name="FindAPro" component={FindAProScreen} options={{ title: "Find a Pro" }} />
      <Stack.Screen name="PublicStorefront" component={PublicStorefrontLazyScreen} options={{ title: "Storefront" }} />

      {/* Shared basics */}
      <Stack.Screen name="ChatThread" component={ChatThreadScreen} options={{ title: "Chat" }} />
      <Stack.Screen name="NewMessage" component={NewMessageScreen} options={{ title: "New message" }} />
      <Stack.Screen name="Support" component={SupportScreen} options={{ title: "Ask for support" }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />

      {/* Pro-only routes (registered only when pro) */}
      {isPro ? (
        <>
          <Stack.Screen name="PostEditor" component={PostEditorLazyScreen} options={{ title: "Post" }} />
          <Stack.Screen name="ClientDetail" component={ClientDetailScreen} options={{ title: "Client" }} />
          <Stack.Screen name="NewClient" component={NewClientScreen} options={{ title: "Add client" }} />
          <Stack.Screen name="NewDocumentRequest" component={NewDocumentRequestScreen} options={{ title: "Document request" }} />
          <Stack.Screen name="Documents" component={DocumentsListScreen} options={{ title: "Documents" }} />
          <Stack.Screen name="DocumentEditor" component={DocumentEditorLazyScreen} options={{ title: "Editor" }} />
          <Stack.Screen name="AdminChangeCustomerEmail" component={AdminChangeCustomerEmailScreen} options={{ title: "Customer email" }} />
          <Stack.Screen name="SupportTickets" component={SupportTicketsListScreen} options={{ title: "Support tickets" }} />
          <Stack.Screen name="SupportTicketDetail" component={SupportTicketDetailScreen} options={{ title: "Ticket" }} />
        </>
      ) : null}

      {/* Admin-only upgrades */}
      {isAdmin ? (
        <>
          <Stack.Screen name="AdminUpgrades" component={AdminUpgradesScreen} options={{ title: "Extra / Upgrades" }} />
          <Stack.Screen name="AdminUpgradeDetail" component={AdminUpgradeDetailScreen} options={{ title: "Feature" }} />
        </>
      ) : null}

      {/* Developer-only tools */}
      {isDev ? (
        <>
          <Stack.Screen name="DeveloperFeed" component={DeveloperFeedControlLazyScreen} options={{ title: "Developer feed" }} />
          <Stack.Screen name="DevPanel" component={DevPanelScreen} options={{ title: "Dev panel" }} />
          <Stack.Screen name="DeveloperUnlock" component={DeveloperUnlockScreen} options={{ title: "Developer tools" }} />
          <Stack.Screen name="DeveloperAudit" component={DeveloperAuditScreen} options={{ title: "Audit log" }} />
          <Stack.Screen name="DeveloperTickets" component={DeveloperTicketsScreen} options={{ title: "All tickets" }} />
        </>
      ) : null}
    </Stack.Navigator>
  );
}
