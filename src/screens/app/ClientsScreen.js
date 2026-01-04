import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";

import { Screen } from "../../components/Screen";
import { Header } from "../../components/Header";
import { TextField } from "../../components/TextField";
import { ListRow } from "../../components/ListRow";
import { theme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";

export function ClientsScreen({ navigation }) {
  const { workspace } = useAppState();
  const actions = useAppActions();

  const [query, setQuery] = useState("");
  const [clients, setClients] = useState([]);

  const subtitle = useMemo(() => (workspace ? `${workspace.name}` : ""), [workspace]);

  async function refresh() {
    if (!workspace) return;
    const list = await actions.safeCall(
      () => actions.backend.clients.list({ workspaceId: workspace.id, query }),
      { title: "Load failed" }
    );
    if (list) setClients(list);
  }

  useEffect(() => {
    refresh();
  }, [workspace?.id, query]);

  return (
    <Screen>
      <Header title="Clients" subtitle={subtitle} right={null} />
      <View style={styles.search}>
        <TextField label="Search" value={query} onChangeText={setQuery} placeholder="Name or email" />
      </View>
      <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: theme.spacing.xl }}>
        {clients.map((c) => (
          <ListRow
            key={c.id}
            title={c.name}
            subtitle={c.email}
            onPress={() => {
              actions.selectClient(c.id);
              navigation.navigate("ClientDetail", { clientId: c.id });
            }}
          />
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    paddingHorizontal: theme.spacing.lg,
  },
  list: {
    flex: 1,
  },
});
