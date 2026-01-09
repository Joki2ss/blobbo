import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";

import { Screen } from "../../components/Screen";
import { Header } from "../../components/Header";
import { Card } from "../../components/Card";
import { ListRow } from "../../components/ListRow";
import { Button } from "../../components/Button";
import { useTheme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";
import { getSupportRuntimeConfig } from "../../config/supportFlags";
import { isDeveloperUser } from "../../support/SupportPermissions";
import { listFeedPosts, PLAN_TYPES, VISIBILITY_STATUS, updateFeedPost } from "../../feed";
import { cloudListAllFeedPostsForDeveloper } from "../../services/cloudFeedService";
import { devRpcUpdatePost } from "../../services/devRpcService";

export function DeveloperFeedControlScreen({ navigation }) {
  const { backendMode, session, developerUnlocked } = useAppState();
  const actions = useAppActions();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const user = session?.user || null;

  const cfg = useMemo(() => getSupportRuntimeConfig({ backendMode }), [backendMode]);
  const isDev = useMemo(() => isDeveloperUser(user), [user?.role]);

  const [posts, setPosts] = useState([]);

  async function refresh() {
    if (!cfg.PUBLIC_FEED_ENABLED) return;
    if (!isDev) return;
    const list = await actions.safeCall(async () => {
      if (backendMode === "CLOUD") {
        return cloudListAllFeedPostsForDeveloper({ limit: 200 });
      }
      return listFeedPosts({ includeAllForDeveloper: true });
    }, { title: "Feed" });
    if (Array.isArray(list)) setPosts(list);
  }

  useEffect(() => {
    refresh();
  }, [backendMode, cfg.PUBLIC_FEED_ENABLED, isDev]);

  async function togglePause(post) {
    const next = post.visibilityStatus === VISIBILITY_STATUS.PAUSED ? VISIBILITY_STATUS.ACTIVE : VISIBILITY_STATUS.PAUSED;
    await actions.safeCall(async () => {
      if (backendMode === "CLOUD") {
        await devRpcUpdatePost({ postId: post.postId, visibilityStatus: next, reason: "dev_toggle" });
        return;
      }
      return updateFeedPost({ actor: user, postId: post.postId, patch: { visibilityStatus: next }, allowDeveloperOverride: true });
    }, { title: "Update" });
    refresh();
  }

  if (!cfg.PUBLIC_FEED_ENABLED) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content}>
          <Header title="Developer feed" subtitle="Disabled" />
          <Card>
            <Text style={styles.muted}>Public feed is disabled in this mode.</Text>
          </Card>
          <Button title="Back" variant="secondary" onPress={() => navigation.goBack()} />
        </ScrollView>
      </Screen>
    );
  }

  if (!isDev) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content}>
          <Header title="Developer feed" subtitle="Developer access required" />
          <Card>
            <Text style={styles.muted}>Unlock developer tools to access this panel.</Text>
          </Card>
          <Button title="Back" variant="secondary" onPress={() => navigation.goBack()} />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Developer feed" subtitle={`All posts: ${posts.length}`} />
      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xl }}>
        <View style={styles.content}>
          <Card style={styles.card}>
            <Button title="Create WELCOME post" onPress={() => navigation.navigate("PostEditor", { mode: "create", devPlan: PLAN_TYPES.WELCOME })} />
            <View style={{ height: theme.spacing.sm }} />
            <Button title="Refresh" variant="secondary" onPress={refresh} />
          </Card>

          {posts.map((p) => (
            <Card key={p.postId} style={styles.card}>
              <ListRow
                title={p.title}
                subtitle={`${p.ownerBusinessName} â€¢ ${p.planType} â€¢ ${p.visibilityStatus} â€¢ score ${p.rankingScore}`}
                onPress={() => navigation.navigate("PostEditor", { mode: "edit", postId: p.postId })}
              />
              <View style={styles.rowButtons}>
                <Button title={p.visibilityStatus === VISIBILITY_STATUS.PAUSED ? "Resume" : "Pause"} variant="secondary" onPress={() => togglePause(p)} />
                <Button title="Edit" variant="secondary" onPress={() => navigation.navigate("PostEditor", { mode: "edit", postId: p.postId })} />
              </View>
            </Card>
          ))}

          <Button title="Back" variant="secondary" onPress={() => navigation.goBack()} />
        </View>
      </ScrollView>
    </Screen>
  );
}


function makeStyles(theme) {
  return StyleSheet.create({
    content: {
      padding: theme.spacing.lg,
    },
    card: {
      marginBottom: theme.spacing.md,
    },
    muted: {
      ...theme.typography.small,
      color: theme.colors.mutedText,
    },
    rowButtons: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
  });
}
