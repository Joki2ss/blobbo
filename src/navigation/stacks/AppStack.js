import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { TabNavigator } from "../tabs/TabNavigator";
import { ClientDetailScreen } from "../../screens/app/ClientDetailScreen";
import { ChatThreadScreen } from "../../screens/app/ChatThreadScreen";
import { NewClientScreen } from "../../screens/app/NewClientScreen";
import { NewDocumentRequestScreen } from "../../screens/app/NewDocumentRequestScreen";
import { NewMessageScreen } from "../../screens/app/NewMessageScreen";
import { SupportScreen } from "../../screens/app/SupportScreen";

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
    </Stack.Navigator>
  );
}
