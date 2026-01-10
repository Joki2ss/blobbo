import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, Pressable, useWindowDimensions } from "react-native";
import { Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../../components/Screen";
import { Header } from "../../components/Header";
import { SmartHeader } from "../../ui/components/SmartHeader";
import { Card } from "../../components/Card";
import { TextField } from "../../components/TextField";
import { Button } from "../../components/Button";
import { useTheme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";
import { getSupportRuntimeConfig } from "../../config/supportFlags";
import { isAdminOrBusiness } from "../../utils/roles";
import { isDeveloperUser } from "../../support/SupportPermissions";
import { ensureSeedPosts, searchFeedPosts } from "../../feed";
import { cloudSearchPublicFeedPosts } from "../../services/cloudFeedService";
import { BUSINESSCAFE_DESCRIPTION_KEY, PRODUCT_NAME, selectBusinessCafePlaceholderImageKey } from "../../hub/BusinessCafeBranding";
import { t } from "../../i18n/strings";
import { ListRow } from "../../components/ListRow";

export function PublicFeedScreen({ navigation }) {
  const { session, backendMode, developerUnlocked } = useAppState();
  const actions = useAppActions();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const dims = useWindowDimensions();
  const isDesktop = dims.width >= 1024;

  const user = session?.user || null;
  const cfg = useMemo(() => getSupportRuntimeConfig({ backendMode }), [backendMode]);

  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState([]);

  const canCreate = useMemo(() => {
    if (!user) return false;
    if (isAdminOrBusiness(user.role)) return true;
    return isDeveloperUser(user);
  }, [user?.id, user?.role]);

  const isDev = useMemo(() => isDeveloperUser(user), [user?.role]);

  async function refresh() {
    if (!cfg.PUBLIC_FEED_ENABLED) {
      setPosts([]);
      return;
    }

    const list = await actions.safeCall(async () => {
      if (backendMode === "MOCK") {
        await ensureSeedPosts();
        return searchFeedPosts({ query, includeAllForDeveloper: false });
      }
      // CLOUD: query Supabase safe view (authenticated-only by default).
      return cloudSearchPublicFeedPosts({ query, limit: 60 });
    }, { title: "Feed" });

    if (Array.isArray(list)) setPosts(list);
  }

  useEffect(() => {
    refresh();
  }, [backendMode, cfg.PUBLIC_FEED_ENABLED, query]);

  const placeholderKey = useMemo(() => selectBusinessCafePlaceholderImageKey({ width: dims.width }), [dims.width]);

  // Patch (B): SmartHeader hide/show on scroll
  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_MAX_Y = 80;

  return (
    <Screen>
      <SmartHeader
        title={PRODUCT_NAME}
        subtitle={t(BUSINESSCAFE_DESCRIPTION_KEY)}
        right={
          cfg.PUBLIC_FEED_ENABLED ? (
            <View style={styles.headerRightRow}>
              <Pressable
                onPress={() => navigation.navigate("MapSearch")}
                style={({ pressed }) => [styles.iconWrap, pressed ? { opacity: 0.85 } : null]}
              >
                <Ionicons name="map-outline" size={18} color={theme.colors.primary} />
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate("FindAPro")}
                style={({ pressed }) => [styles.iconWrap, pressed ? { opacity: 0.85 } : null]}
              >
                <Ionicons name="search-outline" size={18} color={theme.colors.primary} />
              </Pressable>
              {user && canCreate ? (
                <Pressable
                  onPress={() => navigation.navigate("PostEditor", { mode: "create" })}
                  style={({ pressed }) => [styles.iconWrap, pressed ? { opacity: 0.85 } : null]}
                >
                  <Ionicons name="add" size={18} color={theme.colors.primary} />
                </Pressable>
              ) : null}
            </View>
          ) : null
        }
        scrollY={scrollY}
        maxY={HEADER_MAX_Y}
      />

      <Animated.ScrollView
        contentContainerStyle={styles.content}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {!cfg.PUBLIC_FEED_ENABLED ? (
          <Card>
            <Text style={styles.h}>Public feed disabled</Text>
            <Text style={styles.muted}>This feature is disabled in this mode.</Text>
          </Card>
        ) : (
          <>
            <Card style={styles.card}>
              <Text style={styles.muted}>Placeholder hero (not loaded): {placeholderKey}</Text>

              <TextField
                label="Search"
                value={query}
                onChangeText={setQuery}
                placeholder="Search services, keywords, category..."
                right={<Ionicons name="search" size={16} color={theme.colors.mutedText} />}
              />

              {!user ? (
                <View style={{ marginTop: theme.spacing.sm }}>
                  <Button title={t("cta.becomeBusiness")} onPress={() => navigation.navigate("BusinessSignup")} />
                  <View style={{ height: theme.spacing.sm }} />
                  <Button title={t("cta.login")} variant="secondary" onPress={() => navigation.navigate("Login")} />
                </View>
              ) : canCreate ? (
                <Text style={styles.muted}>You can publish and manage posts from here.</Text>
              ) : (
                <Text style={styles.muted}>Browse and search. Business/admin accounts can publish posts.</Text>
              )}

              {isDev ? (
                <View style={{ marginTop: theme.spacing.sm }}>
                  <Button title="Developer feed control" variant="secondary" onPress={() => navigation.navigate("DeveloperFeed") } />
                  <View style={{ height: theme.spacing.sm }} />
                  <Button title="Dev panel" variant="secondary" onPress={() => navigation.navigate("DevPanel") } />
                </View>
              ) : null}
            </Card>

            {posts.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No posts found.</Text>
              </View>
            ) : (
              isDesktop ? (
                posts.map((p) => (
                  <ListRow
                    key={p.postId}
                    title={p.title}
                    subtitle={p.ownerBusinessName + (p.ownerCategory ? ` • ${p.ownerCategory}` : "")}
                    onPress={() => navigation.navigate("PostEditor", { mode: "edit", postId: p.postId })}
                    right={<Text style={{ color: '#64748B', fontSize: 12 }}>{p.status || ''}</Text>}
                  />
                ))
              ) : (
                posts.map((p) => (
                  <Card key={p.postId} style={styles.card}>
                    <View style={styles.rowTop}>
                      <View style={{ flex: 1 }}>
                        {String(p.authorRole || "").toUpperCase() === "DEVELOPER" ? (
                          <Text style={styles.platformLabel}>Platform update</Text>
                        ) : null}
                        <Text style={styles.title}>{p.title}</Text>
                        <Text style={styles.meta}>
                          {String(p.authorRole || "").toUpperCase() === "DEVELOPER" ? "Platform" : p.ownerBusinessName} • {p.ownerCategory}
                          {p.location ? ` • ${p.location.city || p.location.region}` : ""}
                        </Text>
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

                    {Array.isArray(p.moderationTags) && p.moderationTags.length > 0 ? (
                      <View style={styles.moderationRow}>
                        <Text style={styles.moderationText}>{p.moderationTags.join(" ")}</Text>
                      </View>
                    ) : null}

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
              )
            )}
          </>
        )}

        {user ? null : (
          <View style={{ height: theme.spacing.xl }} />
        )}
      </Animated.ScrollView>
    </Screen>
  );
}

function stripHtml(html) {
  if (typeof html !== "string") return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function makeStyles(theme) {
  return StyleSheet.create({
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
    platformLabel: {
      ...theme.typography.small,
      color: theme.colors.mutedText,
      marginBottom: 4,
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
    moderationRow: {
      marginTop: theme.spacing.sm,
      alignSelf: "flex-start",
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 6,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.chipBg,
    },
    moderationText: {
      ...theme.typography.small,
      color: theme.colors.text,
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
}
