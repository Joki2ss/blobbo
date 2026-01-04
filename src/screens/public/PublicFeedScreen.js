import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../../components/Screen";
import { Header } from "../../components/Header";
import { Card } from "../../components/Card";
import { TextField } from "../../components/TextField";
import { Button } from "../../components/Button";
import { theme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";
import { getSupportRuntimeConfig } from "../../config/supportFlags";
import { isAdminOrBusiness } from "../../utils/roles";
import { isDeveloperUser } from "../../support/SupportPermissions";
import { ensureSeedPosts, searchFeedPosts } from "../../feed";

export function PublicFeedScreen({ navigation }) {
  const { session, backendMode, developerUnlocked } = useAppState();
  const actions = useAppActions();

  const user = session?.user || null;
  const cfg = useMemo(() => getSupportRuntimeConfig({ backendMode }), [backendMode]);

  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState([]);

  const canCreate = useMemo(() => {
    if (!user) return false;
    if (isAdminOrBusiness(user.role)) return true;
    return developerUnlocked && isDeveloperUser(user);
  }, [user?.id, user?.role, developerUnlocked]);

  const isDev = useMemo(() => developerUnlocked && isDeveloperUser(user), [developerUnlocked, user?.email]);

  async function refresh() {
    if (!cfg.PUBLIC_FEED_ENABLED) {
      setPosts([]);
      return;
    }

    if (backendMode === "MOCK") {
      await ensureSeedPosts();
    }

    const list = await actions.safeCall(
      () => searchFeedPosts({ query, includeAllForDeveloper: false }),
      { title: "Feed" }
    );

    if (Array.isArray(list)) setPosts(list);
  }

  useEffect(() => {
    refresh();
  }, [backendMode, cfg.PUBLIC_FEED_ENABLED, query]);

  return (
    <Screen>
      <Header
        title="Discover"
        subtitle={user ? "Public feed" : "Browse services without login"}
        right={
          user ? (
            canCreate ? (
              <Pressable
                onPress={() => navigation.navigate("PostEditor", { mode: "create" })}
                style={({ pressed }) => [styles.iconWrap, pressed ? { opacity: 0.85 } : null]}
              >
                <Ionicons name="add" size={18} color={theme.colors.primary} />
              </Pressable>
            ) : null
          ) : (
            <View style={styles.headerRightRow}>
              <Pressable onPress={() => navigation.navigate("Login")} style={({ pressed }) => [styles.linkBtn, pressed ? { opacity: 0.85 } : null]}>
                <Text style={styles.linkText}>Login</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate("Register")} style={({ pressed }) => [styles.linkBtn, pressed ? { opacity: 0.85 } : null]}>
                <Text style={styles.linkText}>Register</Text>
              </Pressable>
            </View>
          )
        }
      />

      <ScrollView contentContainerStyle={styles.content}>
        {!cfg.PUBLIC_FEED_ENABLED ? (
          <Card>
            <Text style={styles.h}>Public feed disabled</Text>
            <Text style={styles.muted}>This feature is disabled in this mode.</Text>
          </Card>
        ) : (
          <>
            <Card style={styles.card}>
              <TextField
                label="Search"
                value={query}
                onChangeText={setQuery}
                placeholder="Search services, keywords, category..."
                right={<Ionicons name="search" size={16} color={theme.colors.mutedText} />}
              />

              {user && canCreate ? (
                <Text style={styles.muted}>Only business/admin/dev can create posts. Everyone can browse.</Text>
              ) : (
                <Text style={styles.muted}>Scroll and search. Sign in to create posts (business/admin).</Text>
              )}

              {isDev ? (
                <View style={{ marginTop: theme.spacing.sm }}>
                  <Button title="Developer feed control" variant="secondary" onPress={() => navigation.navigate("DeveloperFeed") } />
                </View>
              ) : null}
            </Card>

            {posts.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No posts found.</Text>
              </View>
            ) : (
              posts.map((p) => (
                <Card key={p.postId} style={styles.card}>
                  <View style={styles.rowTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.title}>{p.title}</Text>
                      <Text style={styles.meta}>{p.ownerBusinessName} • {p.ownerCategory}{p.location ? ` • ${p.location.city || p.location.region}` : ""}</Text>
                    </View>
                    {user && (isDev || p.ownerUserId === user.id) ? (
                      <Pressable
                        onPress={() => navigation.navigate("PostEditor", { mode: "edit", postId: p.postId })}
                        style={({ pressed }) => [styles.iconWrap, pressed ? { opacity: 0.85 } : null]}
                      >
                        <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
                      </Pressable>
                    ) : null}
                  </View>

                  {Array.isArray(p.images) && p.images.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imgRow}>
                      {p.images.slice(0, 3).map((img, idx) => (
                        <Image key={idx} source={{ uri: img.uri }} style={styles.img} />
                      ))}
                    </ScrollView>
                  ) : null}

                  <Text style={styles.desc} numberOfLines={6}>
                    {stripHtml(p.description)}
                  </Text>

                  {Array.isArray(p.keywords) && p.keywords.length > 0 ? (
                    <View style={styles.chips}>
                      {p.keywords.slice(0, 8).map((k) => (
                        <View key={k} style={styles.chip}>
                          <Text style={styles.chipText}>#{k}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </Card>
              ))
            )}
          </>
        )}

        {user ? null : (
          <View style={{ height: theme.spacing.xl }} />
        )}
      </ScrollView>
    </Screen>
  );
}

function stripHtml(html) {
  if (typeof html !== "string") return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: theme.spacing.xl,
  },
  card: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  headerRightRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  linkBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.chipBg,
  },
  linkText: {
    ...theme.typography.h3,
    color: theme.colors.text,
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
  empty: {
    padding: theme.spacing.xl,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.mutedText,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  meta: {
    ...theme.typography.small,
    color: theme.colors.mutedText,
    marginTop: 4,
  },
  desc: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  imgRow: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  img: {
    width: 120,
    height: 90,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.border,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  chip: {
    backgroundColor: theme.colors.chipBg,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  chipText: {
    ...theme.typography.small,
    color: theme.colors.text,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.chipBg,
    alignItems: "center",
    justifyContent: "center",
  },
});
