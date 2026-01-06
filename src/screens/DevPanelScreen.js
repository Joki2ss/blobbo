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
import { logDevAudit, listDevAudit } from "../services/devAuditService";
import { searchFeedPosts, updateFeedPost } from "../feed/FeedService";
import { devListRatingEventsForBusiness, devDeleteRatingEvent } from "../services/ratingsService";

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

  useEffect(() => {
    if (!allowed) return;
    if (entityType !== "Audit") return;
    (async () => {
      const list = await listDevAudit();
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
      await logDevAudit({ actionType: "dev.search.profiles", targetId: q, meta: { count: Array.isArray(list) ? list.length : 0 } });
      return;
    }

    if (entityType === "Feed posts") {
      const list = await actions.safeCall(
        () => searchFeedPosts({ query: q, includeAllForDeveloper: true }),
        { title: "Dev search" }
      );
      setResults(Array.isArray(list) ? list : []);
      await logDevAudit({ actionType: "dev.search.posts", targetId: q, meta: { count: Array.isArray(list) ? list.length : 0 } });
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
      await logDevAudit({ actionType: "dev.search.ratings", targetId: q, meta: { count: Array.isArray(list) ? list.length : 0 } });
      return;
    }

    setResults([]);
  }

  async function togglePostVisibility(post) {
    if (!post?.postId) return;
    const nextStatus = post.visibilityStatus === "PAUSED" ? "ACTIVE" : "PAUSED";

    const res = await actions.safeCall(
      () => updateFeedPost({ actor: user, postId: post.postId, patch: { visibilityStatus: nextStatus }, allowDeveloperOverride: true }),
      { title: "Moderation" }
    );

    if (res?.ok) {
      await logDevAudit({ actionType: "dev.posts.set_visibility", targetId: post.postId, meta: { visibilityStatus: nextStatus } });
      await runSearch();
    }
  }

  async function deleteRatingEvent(eventId) {
    const res = await actions.safeCall(
      () => devDeleteRatingEvent({ backendMode, backendRatings: actions.backend.ratings, eventId }),
      { title: "Delete rating" }
    );
    if (res?.ok) {
      await logDevAudit({ actionType: "dev.ratings.delete", targetId: eventId, meta: {} });
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
                  <Text style={styles.muted}>{[item.storefrontCategory, item.storefrontCity, item.storefrontRegion].filter(Boolean).join(" • ")}</Text>
                </Card>
              );
            }

            if (entityType === "Feed posts") {
              return (
                <Card style={styles.itemCard}>
                  <Text style={styles.h}>{item.title}</Text>
                  <Text style={styles.muted}>{item.ownerBusinessName} • {item.visibilityStatus}</Text>
                  <View style={{ height: theme.spacing.sm }} />
                  <Button
                    title={item.visibilityStatus === "PAUSED" ? "Restore" : "Hide"}
                    variant="secondary"
                    onPress={() => togglePostVisibility(item)}
                  />
                </Card>
              );
            }

            if (entityType === "Ratings") {
              return (
                <Card style={styles.itemCard}>
                  <Text style={styles.h}>Rating {item.ratingValue} / 5</Text>
                  <Text style={styles.muted}>raterHash: {item.raterHash ? item.raterHash.slice(0, 10) + "…" : ""}</Text>
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
