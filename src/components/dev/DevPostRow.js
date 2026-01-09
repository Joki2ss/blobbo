import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "../Card";
import { Button } from "../Button";
import { TextField } from "../TextField";
import { Chip } from "../Chip";
import { useTheme } from "../../theme";

export function DevPostRow({
  post,
  selected,
  onToggleSelect,
  onEdit,
  onHideToggle,
  onDeleteToggle,
  onSetPinnedRank,
  onToggleTag,
  tagOptions,
}) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [rankText, setRankText] = useState(post?.pinnedRank === null || post?.pinnedRank === undefined ? "" : String(post.pinnedRank));

  const tags = Array.isArray(post?.moderationTags) ? post.moderationTags : [];

  return (
    <Pressable onPress={onToggleSelect} style={({ pressed }) => [pressed ? { opacity: 0.95 } : null]}>
      <Card style={[styles.card, selected ? styles.selected : null]}>
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.h}>{post?.title || "(untitled)"}</Text>
            <Text style={styles.muted}>
              {post?.ownerBusinessName || ""} • {post?.visibilityStatus || ""}
              {Number.isFinite(Number(post?.pinnedRank)) ? ` • pinned:${post.pinnedRank}` : ""}
            </Text>
          </View>
          <Chip label={selected ? "Selected" : "Tap to select"} tone={selected ? "success" : "default"} />
        </View>

        {tags.length ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{tags.join(" ")}</Text>
          </View>
        ) : null}

        <View style={{ height: theme.spacing.sm }} />

        <View style={styles.actionsRow}>
          <Button title="Edit" variant="secondary" onPress={onEdit} />
          <Button title={post?.visibilityStatus === "PAUSED" ? "Unhide" : "Hide"} variant="secondary" onPress={onHideToggle} />
          <Button title={post?.visibilityStatus === "DELETED" ? "Restore" : "Delete"} variant="secondary" onPress={onDeleteToggle} />
        </View>

        <View style={{ height: theme.spacing.sm }} />

        <View style={styles.pinRow}>
          <View style={{ flex: 1 }}>
            <TextField
              label="Pinned rank (blank = unpin)"
              value={rankText}
              onChangeText={setRankText}
              placeholder="e.g. 1"
              keyboardType="numeric"
            />
          </View>
          <View style={{ width: theme.spacing.sm }} />
          <Button title="Set" onPress={() => onSetPinnedRank(rankText)} />
        </View>

        <View style={{ height: theme.spacing.sm }} />

        <Text style={styles.muted}>Moderation tags</Text>
        <View style={styles.tagsRow}>
          {tagOptions.map((t) => {
            const on = tags.includes(t);
            return (
              <Pressable key={t} onPress={() => onToggleTag(t)} style={({ pressed }) => [pressed ? { opacity: 0.9 } : null]}>
                <Chip label={t} tone={on ? "warning" : "default"} />
              </Pressable>
            );
          })}
        </View>
      </Card>
    </Pressable>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    card: {
      marginBottom: theme.spacing.md,
    },
    selected: {
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: theme.spacing.sm,
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
    badge: {
      marginTop: theme.spacing.sm,
      alignSelf: "flex-start",
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 6,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.chipBg,
    },
    badgeText: {
      ...theme.typography.small,
      color: theme.colors.text,
    },
    actionsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.sm,
    },
    pinRow: {
      flexDirection: "row",
      alignItems: "flex-end",
    },
    tagsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
  });
}
