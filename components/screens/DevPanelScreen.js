import React, { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Screen } from "../components/Screen";
import { Header } from "../components/Header";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { Chip } from "../components/Chip";
import { useTheme } from "../theme";
import { useAppActions, useAppState } from "../store/AppStore";
import { getFeatureFlags } from "../config/featureFlags";
import { isDeveloper } from "../services/rbac";
import { listAudit, logAudit } from "../services/auditService";
import { devSearchPosts, devSetModerationTags, devSetPinnedRank, devSetPostVisibility } from "../services/devFeedService";
import { VISIBILITY_STATUS } from "../feed/FeedPlans";
import { devListRatingEventsForBusiness, devDeleteRatingEvent } from "../services/ratingsService";
import { DEV_MODERATION_TAG_PRESETS } from "../config/devModerationTags";
import { DevPostRow } from "../components/dev/DevPostRow";
import { DevBulkActionsBar } from "../components/dev/DevBulkActionsBar";
import { DevPinnedReorder } from "../components/dev/DevPinnedReorder";

const TYPES = ["Profiles", "Feed posts", "Ratings", "Audit"];

export function DevPanelScreen({ navigation }) {
  const { backendMode, session, developerUnlocked } = useAppState();
  const actions = useAppActions();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const flags = useMemo(() => getFeatureFlags({ backendMode }), [backendMode]);
  const user = session?.user || null;

  const allowed = useMemo(
    () => flags.ENABLE_DEV_PANEL && isDeveloper({ user, backendMode, developerUnlocked }),
    [flags.ENABLE_DEV_PANEL, user?.id, user?.role, backendMode, developerUnlocked]
  );

  const [entityType, setEntityType] = useState(TYPES[0]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [audit, setAudit] = useState([]);
  const [selectedPostIds, setSelectedPostIds] = useState([]);

  useEffect(() => {
    if (!allowed) return;
    if (entityType !== "Audit") return;
    (async () => {
      const list = await listAudit({ limit: 200 });
      setAudit(list);
    })();
  }, [allowed, entityType]);

  async function runSearch() {
    if (!allowed) {
      Alert.alert("Forbidden", "Developer access required.");
      return;
    }

    const q = String(query || "").trim();

    if (entityType === "Profiles") {
      const list = await actions.safeCall(
        () => actions.backend.users.searchPublicProfiles({ q, limit: 50 }),
        { title: "Dev search" }
      );
      setResults(Array.isArray(list) ? list : []);
      await logAudit({
        actorUserId: user?.id,
        actionType: "SEARCH_PROFILES",
        targetType: "query",
        targetId: q,
        metadata: { count: Array.isArray(list) ? list.length : 0 },
      });
      return;
    }

    if (entityType === "Feed posts") {
      const list = await actions.safeCall(
        () => devSearchPosts({ user, backendMode, developerUnlocked, query: q }),
        { title: "Dev search" }
      );
      setResults(Array.isArray(list) ? list : []);
      setSelectedPostIds([]);
      await logAudit({
        actorUserId: user?.id,
        actionType: "SEARCH_POSTS",
        targetType: "query",
        targetId: q,
        metadata: { count: Array.isArray(list) ? list.length : 0 },
      });
      return;
    }

    if (entityType === "Ratings") {
      if (!q) {
        setResults([]);
        return;
      }
      const list = await actions.safeCall(
        () => devListRatingEventsForBusiness({ backendMode, backendRatings: actions.backend.ratings, businessId: q, limit: 200 }),
        { title: "Dev ratings" }
      );
      setResults(Array.isArray(list) ? list : []);
      await logAudit({
        actorUserId: user?.id,
        actionType: "SEARCH_RATINGS",
        targetType: "business",
        targetId: q,
        metadata: { count: Array.isArray(list) ? list.length : 0 },
      });
      return;
    }

    setResults([]);
  }

  function toggleSelectPost(postId) {
    setSelectedPostIds((prev) => {
      const arr = Array.isArray(prev) ? prev : [];
      if (arr.includes(postId)) return arr.filter((x) => x !== postId);
      return [...arr, postId];
    });
  }

  async function onPostHideToggle(post) {
    if (!post?.postId) return;
    const nextStatus = post.visibilityStatus === VISIBILITY_STATUS.PAUSED ? VISIBILITY_STATUS.ACTIVE : VISIBILITY_STATUS.PAUSED;
    const res = await actions.safeCall(
      () => devSetPostVisibility({ user, backendMode, developerUnlocked, postId: post.postId, visibilityStatus: nextStatus, reason: "" }),
      { title: "Moderation" }
    );
    if (res?.ok) await runSearch();
  }

  async function onPostDeleteToggle(post) {
    if (!post?.postId) return;
    const nextStatus = post.visibilityStatus === VISIBILITY_STATUS.DELETED ? VISIBILITY_STATUS.ACTIVE : VISIBILITY_STATUS.DELETED;
    const res = await actions.safeCall(
      () => devSetPostVisibility({ user, backendMode, developerUnlocked, postId: post.postId, visibilityStatus: nextStatus, reason: "" }),
      { title: "Moderation" }
    );
    if (res?.ok) await runSearch();
  }

  async function onSetPinnedRank(post, rankText) {
    if (!post?.postId) return;
    const res = await actions.safeCall(
      () => devSetPinnedRank({ user, backendMode, developerUnlocked, postId: post.postId, pinnedRank: rankText, reason: "" }),
      { title: "Pin" }
    );
    if (res?.ok) await runSearch();
  }

  async function onToggleTag(post, tag) {
    if (!post?.postId) return;
    const existing = Array.isArray(post.moderationTags) ? post.moderationTags : [];
    const next = existing.includes(tag) ? existing.filter((t) => t !== tag) : [...existing, tag];
    const res = await actions.safeCall(
      () => devSetModerationTags({ user, backendMode, developerUnlocked, postId: post.postId, moderationTags: next, reason: "" }),
      { title: "Tags" }
    );
    if (res?.ok) await runSearch();
  }

  async function bulkSetPinnedRange(startRankText) {
    const start = Number(startRankText);
    if (!Number.isFinite(start)) return;
    const selected = (Array.isArray(selectedPostIds) ? selectedPostIds : []).slice();
    if (selected.length === 0) return;
    const list = Array.isArray(results) ? results : [];
    const selectedPosts = list.filter((p) => selected.includes(p.postId));
    selectedPosts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    for (let i = 0; i < selectedPosts.length; i++) {
      const p = selectedPosts[i];
      // eslint-disable-next-line no-await-in-loop
      await devSetPinnedRank({ user, backendMode, developerUnlocked, postId: p.postId, pinnedRank: start + i, reason: "bulk" });
    }
    await runSearch();
  }

  async function bulkSetVisibility(status) {
    const selected = (Array.isArray(selectedPostIds) ? selectedPostIds : []).slice();
    if (selected.length === 0) return;
    for (const postId of selected) {
      // eslint-disable-next-line no-await-in-loop
      await devSetPostVisibility({ user, backendMode, developerUnlocked, postId, visibilityStatus: status, reason: "bulk" });
    }
    await runSearch();
  }

  async function bulkUnpin() {
    const selected = (Array.isArray(selectedPostIds) ? selectedPostIds : []).slice();
    if (selected.length === 0) return;
    for (const postId of selected) {
      // eslint-disable-next-line no-await-in-loop
      await devSetPinnedRank({ user, backendMode, developerUnlocked, postId, pinnedRank: null, reason: "bulk" });
    }
    await runSearch();
  }

  async function deleteRatingEvent(eventId) {
    const res = await actions.safeCall(
      () => devDeleteRatingEvent({ backendMode, backendRatings: actions.backend.ratings, eventId }),
      { title: "Delete rating" }
    );
    if (res?.ok) {
      await logAudit({ actorUserId: user?.id, actionType: "RATING_DELETE", targetType: "rating_event", targetId: eventId, metadata: null });
      await runSearch();
    }
  }

  if (!allowed) {
    return (
      <Screen>
        <Header title="Dev Panel" subtitle="Disabled or forbidden" />
        <View style={styles.content}>
          <Card>
            <Text style={styles.muted}>Developer access is required. In LIVE, this must be enforced server-side by role claims.</Text>
            <View style={{ height: theme.spacing.md }} />
            <Button title="Back" variant="secondary" onPress={() => navigation.goBack()} />
          </Card>
        </View>
      </Screen>
    );
  }

  const data = entityType === "Audit" ? audit : results;
  const pinnedPosts = useMemo(() => {
    if (entityType !== "Feed posts") return [];
    const list = Array.isArray(results) ? results : [];
    return list
      .filter((p) => Number.isFinite(Number(p.pinnedRank)))
      .slice()
      .sort((a, b) => Number(a.pinnedRank) - Number(b.pinnedRank));
  }, [entityType, results]);

  return (
    <Screen>
      <Header title="Dev Panel" subtitle="Moderation & search" />
      <View style={styles.content}>
        <Card style={styles.card}>
          <TextField label="Search" value={query} onChangeText={setQuery} placeholder="Query (Ratings: businessId)" />
          <View style={styles.row}>
            {TYPES.map((t) => (
              <Pressable key={t} onPress={() => setEntityType(t)} style={({ pressed }) => [styles.pillWrap, pressed ? { opacity: 0.85 } : null]}>
                <Chip label={t} tone={t === entityType ? "success" : "default"} />
              </Pressable>
            ))}
          </View>
          <View style={{ height: theme.spacing.sm }} />
          <Button title="Search" onPress={runSearch} />
        </Card>

        {entityType === "Feed posts" ? (
          <>
            <DevBulkActionsBar
              selectedCount={Array.isArray(selectedPostIds) ? selectedPostIds.length : 0}
              onClear={() => setSelectedPostIds([])}
              onBulkPinRange={bulkSetPinnedRange}
              onBulkUnpin={bulkUnpin}
              onBulkHide={() => bulkSetVisibility(VISIBILITY_STATUS.PAUSED)}
              onBulkUnhide={() => bulkSetVisibility(VISIBILITY_STATUS.ACTIVE)}
              onBulkDelete={() => bulkSetVisibility(VISIBILITY_STATUS.DELETED)}
              onBulkRestore={() => bulkSetVisibility(VISIBILITY_STATUS.ACTIVE)}
            />

            <DevPinnedReorder
              pinnedPosts={pinnedPosts}
              onMoveUp={async (idx) => {
                if (idx <= 0) return;
                const a = pinnedPosts[idx - 1];
                const b = pinnedPosts[idx];
                await devSetPinnedRank({ user, backendMode, developerUnlocked, postId: a.postId, pinnedRank: b.pinnedRank, reason: "reorder" });
                await devSetPinnedRank({ user, backendMode, developerUnlocked, postId: b.postId, pinnedRank: a.pinnedRank, reason: "reorder" });
                await runSearch();
              }}
              onMoveDown={async (idx) => {
                if (idx >= pinnedPosts.length - 1) return;
                const a = pinnedPosts[idx];
                const b = pinnedPosts[idx + 1];
                await devSetPinnedRank({ user, backendMode, developerUnlocked, postId: a.postId, pinnedRank: b.pinnedRank, reason: "reorder" });
                await devSetPinnedRank({ user, backendMode, developerUnlocked, postId: b.postId, pinnedRank: a.pinnedRank, reason: "reorder" });
                await runSearch();
              }}
            />
          </>
        ) : null}

        <FlatList
          data={data}
          keyExtractor={(x, i) => String(x?.id || x?.postId || i)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            if (entityType === "Profiles") {
              const businessName = item.storefrontBusinessName || item.fullName || "Profile";
              return (
                <Card style={styles.itemCard}>
                  <Text style={styles.h}>{businessName}</Text>
                  <Text style={styles.muted}>{[item.storefrontCategory, item.storefrontCity, item.storefrontRegion].filter(Boolean).join(" â€¢ ")}</Text>
                </Card>
              );
            }

            if (entityType === "Feed posts") {
              const selected = Array.isArray(selectedPostIds) ? selectedPostIds.includes(item.postId) : false;
              return (
                <DevPostRow
                  post={item}
                  selected={selected}
                  onToggleSelect={() => toggleSelectPost(item.postId)}
                  onEdit={() => navigation.navigate("PostEditor", { mode: "edit", postId: item.postId })}
                  onHideToggle={() => onPostHideToggle(item)}
                  onDeleteToggle={() => onPostDeleteToggle(item)}
                  onSetPinnedRank={(rankText) => onSetPinnedRank(item, rankText)}
                  onToggleTag={(tag) => onToggleTag(item, tag)}
                  tagOptions={DEV_MODERATION_TAG_PRESETS}
                />
              );
            }

            if (entityType === "Ratings") {
              return (
                <Card style={styles.itemCard}>
                  <Text style={styles.h}>Rating {item.ratingValue} / 5</Text>
                  <Text style={styles.muted}>raterHash: {item.raterHash ? item.raterHash.slice(0, 10) + "â€¦" : ""}</Text>
                  <Text style={styles.muted}>{new Date(item.createdAt || 0).toISOString()}</Text>
                  <View style={{ height: theme.spacing.sm }} />
                  <Button title="Delete event" variant="secondary" onPress={() => deleteRatingEvent(item.id)} />
                </Card>
              );
            }

            return (
              <Card style={styles.itemCard}>
                <Text style={styles.h}>{item.actionType}</Text>
                <Text style={styles.muted}>{item.targetId}</Text>
              </Card>
            );
          }}
          ListEmptyComponent={<Text style={styles.muted}>No results.</Text>}
        />
      </View>
    </Screen>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    content: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    card: {
      marginBottom: theme.spacing.md,
    },
    row: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.sm,
    },
    pillWrap: {
      borderRadius: theme.radius.pill,
    },
    list: {
      paddingBottom: theme.spacing.xl,
    },
    itemCard: {
      marginBottom: theme.spacing.md,
    },
    h: {
      ...theme.typography.h3,
      color: theme.colors.text,
    },
    muted: {
      ...theme.typography.small,
      color: theme.colors.mutedText,
      marginTop: 6,
    },
  });
}
