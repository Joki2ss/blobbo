import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Card } from "../Card";
import { Button } from "../Button";
import { TextField } from "../TextField";
import { useTheme } from "../../theme";

export function DevBulkActionsBar({ selectedCount, onClear, onBulkPinRange, onBulkUnpin, onBulkHide, onBulkUnhide, onBulkDelete, onBulkRestore }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [startRank, setStartRank] = useState("1");

  if (!selectedCount) return null;

  return (
    <Card style={styles.card}>
      <Text style={styles.h}>Bulk actions</Text>
      <Text style={styles.muted}>{selectedCount} selected</Text>

      <View style={{ height: theme.spacing.sm }} />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <TextField label="Pinned start rank" value={startRank} onChangeText={setStartRank} keyboardType="numeric" />
        </View>
        <View style={{ width: theme.spacing.sm }} />
        <Button title="Set range" onPress={() => onBulkPinRange(startRank)} />
      </View>

      <View style={{ height: theme.spacing.sm }} />

      <View style={styles.rowWrap}>
        <Button title="Unpin" variant="secondary" onPress={onBulkUnpin} />
        <Button title="Hide" variant="secondary" onPress={onBulkHide} />
        <Button title="Unhide" variant="secondary" onPress={onBulkUnhide} />
        <Button title="Delete" variant="secondary" onPress={onBulkDelete} />
        <Button title="Restore" variant="secondary" onPress={onBulkRestore} />
        <Button title="Clear selection" variant="secondary" onPress={onClear} />
      </View>
    </Card>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    card: {
      marginBottom: theme.spacing.md,
    },
    h: {
      ...theme.typography.h3,
      color: theme.colors.text,
    },
    muted: {
      ...theme.typography.small,
      color: theme.colors.mutedText,
      marginTop: 4,
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-end",
    },
    rowWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.sm,
    },
  });
}
