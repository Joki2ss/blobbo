import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { TabNavigator } from "../tabs/TabNavigator";
import { ClientDetailScreen } from "../../screens/app/ClientDetailScreen";
import { ChatThreadScreen } from "../../screens/app/ChatThreadScreen";
import { NewClientScreen } from "../../screens/app/NewClientScreen";
import { NewDocumentRequestScreen } from "../../screens/app/NewDocumentRequestScreen";
import { NewMessageScreen } from "../../screens/app/NewMessageScreen";
import { ProfileScreen } from "../../screens/app/ProfileScreen";
import { SupportScreen } from "../../screens/app/SupportScreen";
import { AdminChangeCustomerEmailScreen } from "../../screens/app/AdminChangeCustomerEmailScreen";
import { DeveloperUnlockScreen } from "../../screens/app/DeveloperUnlockScreen";
import { DeveloperAuditScreen } from "../../screens/app/DeveloperAuditScreen";
import { SupportTicketsListScreen } from "../../screens/app/SupportTicketsListScreen";
import { SupportTicketDetailScreen } from "../../screens/app/SupportTicketDetailScreen";
import { DeveloperTicketsScreen } from "../../screens/app/DeveloperTicketsScreen";
import { DocumentsListScreen } from "../../screens/app/DocumentsListScreen";
import { DocumentEditorLazyScreen } from "../../screens/app/DocumentEditorLazyScreen";

const Stack = createNativeStackNavigator();

export function AppStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="ClientDetail" component={ClientDetailScreen} options={{ title: "Client" }} />
      <Stack.Screen name="ChatThread" component={ChatThreadScreen} options={{ title: "Chat" }} />
      <Stack.Screen name="NewMessage" component={NewMessageScreen} options={{ title: "New message" }} />
      <Stack.Screen name="NewClient" component={NewClientScreen} options={{ title: "Add client" }} />
      <Stack.Screen name="NewDocumentRequest" component={NewDocumentRequestScreen} options={{ title: "Document request" }} />
      <Stack.Screen name="Support" component={SupportScreen} options={{ title: "Ask for support" }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
      <Stack.Screen name="AdminChangeCustomerEmail" component={AdminChangeCustomerEmailScreen} options={{ title: "Customer email" }} />
      <Stack.Screen name="DeveloperUnlock" component={DeveloperUnlockScreen} options={{ title: "Developer tools" }} />
      <Stack.Screen name="DeveloperAudit" component={DeveloperAuditScreen} options={{ title: "Audit log" }} />
      <Stack.Screen name="SupportTickets" component={SupportTicketsListScreen} options={{ title: "Support tickets" }} />
      <Stack.Screen name="SupportTicketDetail" component={SupportTicketDetailScreen} options={{ title: "Ticket" }} />
      <Stack.Screen name="DeveloperTickets" component={DeveloperTicketsScreen} options={{ title: "All tickets" }} />
      <Stack.Screen name="Documents" component={DocumentsListScreen} options={{ title: "Documents" }} />
      <Stack.Screen name="DocumentEditor" component={DocumentEditorLazyScreen} options={{ title: "Editor" }} />
    </Stack.Navigator>
  );
}
