import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";

import { Screen } from "../../components/Screen";
import PageHeader from "../../ui/admin/PageHeader";
import AdminCard from "../../ui/admin/AdminCard";
import AdminTable from "../../ui/admin/AdminTable";
import { TextField } from "../../components/TextField";
import { ListRow } from "../../components/ListRow";
import { useTheme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";

export function ClientsScreen({ navigation }) {
  const { workspace } = useAppState();
  const actions = useAppActions();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

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
      <PageHeader title="Customers" action={null} />
      <AdminCard>
        <View style={styles.search}>
          <TextField label="Search" value={query} onChangeText={setQuery} placeholder="Name or email" />
        </View>
        <AdminTable>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} onClick={() => { actions.selectClient(c.id); navigation.navigate("ClientDetail", { clientId: c.id }); }} style={{ cursor: "pointer" }}>
                <td style={{ padding: 12, fontWeight: 500 }}>{c.name}</td>
                <td style={{ padding: 12 }}>{c.email}</td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      </AdminCard>
    </Screen>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    search: {
      paddingHorizontal: theme.spacing.lg,
    },
    list: {
      flex: 1,
    },
  });
}
