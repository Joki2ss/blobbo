import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../../components/Screen";
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
  const user = session?.user || null;
  const cfg = useMemo(() => getSupportRuntimeConfig({ backendMode }), [backendMode]);
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState([]);
  const canCreate = useMemo(() => {
    if (!user) return false;
    if (isAdminOrBusiness(user.role)) return true;
    return isDeveloperUser(user);
  }, [user?.id, user?.role]);
  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_MAX_Y = 80;

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
      return cloudSearchPublicFeedPosts({ query, limit: 60 });
    }, { title: "Feed" });
    if (Array.isArray(list)) setPosts(list);
  }

  useEffect(() => { refresh(); }, [backendMode, cfg.PUBLIC_FEED_ENABLED, query]);

  return (
    <Screen>
      <SmartHeader
        title={PRODUCT_NAME}
        subtitle={t(BUSINESSCAFE_DESCRIPTION_KEY)}
        right={
          cfg.PUBLIC_FEED_ENABLED ? (
            <View style={{ flexDirection: "row" }}>
              <Pressable onPress={() => navigation.navigate("MapSearch")}> <Ionicons name="map-outline" size={18} color={theme.colors.primary} /> </Pressable>
              <Pressable onPress={() => navigation.navigate("FindAPro")}> <Ionicons name="search-outline" size={18} color={theme.colors.primary} /> </Pressable>
              {user && canCreate ? (
                <Pressable onPress={() => navigation.navigate("PostEditor", { mode: "create" })}> <Ionicons name="add" size={18} color={theme.colors.primary} /> </Pressable>
              ) : null}
            </View>
          ) : null
        }
        scrollY={scrollY}
        minY={0}
        maxY={HEADER_MAX_Y}
      />
      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={Animated.event([
          { nativeEvent: { contentOffset: { y: scrollY } } }
        ], { useNativeDriver: true })}
      >
        {/* ...render feed posts qui... */}
      </Animated.ScrollView>
    </Screen>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    // ...stili come prima...
  });
}
