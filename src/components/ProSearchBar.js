import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Card } from "./Card";
import { TextField } from "./TextField";
import { useTheme } from "../theme";

export function ProSearchBar({ value, onChangeText, inputRef, suggestions, onSelectSuggestion }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const list = Array.isArray(suggestions) ? suggestions : [];

  return (
    <Card style={styles.wrap}>
      <TextField
        label={null}
        value={value}
        onChangeText={onChangeText}
        placeholder="Search a professional"
        inputRef={inputRef}
        autoFocus={false}
        returnKeyType="search"
        right={<Ionicons name="search" size={16} color={theme.colors.mutedText} />}
      />

      {list.length ? (
        <>
          {list.map((s) => (
            <Pressable
              key={s}
              onPress={() => onSelectSuggestion && onSelectSuggestion(s)}
              style={({ pressed }) => [styles.suggestion, pressed ? { opacity: 0.85 } : null]}
            >
              <Ionicons name="sparkles-outline" size={14} color={theme.colors.mutedText} />
              <Text style={styles.suggestionText} numberOfLines={1}>
                {s}
              </Text>
            </Pressable>
          ))}
        </>
      ) : null}
    </Card>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    wrap: {
      padding: theme.spacing.md,
    },
    suggestion: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    suggestionText: {
      flex: 1,
      ...theme.typography.body,
      color: theme.colors.text,
    },
  });
}
