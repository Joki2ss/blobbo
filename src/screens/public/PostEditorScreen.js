import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, View, Text, StyleSheet, Image, Pressable } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { TextField } from "../../components/TextField";
import { Button } from "../../components/Button";
import { useTheme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";
import { getSupportRuntimeConfig } from "../../config/supportFlags";
import { isAdminOrBusiness } from "../../utils/roles";
import { isDeveloperUser } from "../../support/SupportPermissions";
import { getStorefrontAddressMissingFields, normalizeStorefrontField } from "../../storefront/storefrontValidation";
import {
  PLAN_TYPES,
  VISIBILITY_STATUS,
  createFeedPost,
  deleteFeedPost,
  getPlanQuotaInfo,
  listFeedPosts,
  updateFeedPost,
} from "../../feed";
import { FeedRichTextEditor } from "../../feed/FeedRichTextEditor";

const CATEGORY_PRESETS = ["lawyer", "accountant", "doctor", "artisan", "consultant", "therapist", "trainer"];

export function PostEditorScreen({ navigation, route }) {
  const { session, backendMode, developerUnlocked } = useAppState();
  const actions = useAppActions();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const user = session?.user || null;

  const cfg = useMemo(() => getSupportRuntimeConfig({ backendMode }), [backendMode]);

  const mode = route?.params?.mode || "create";
  const postId = route?.params?.postId || null;
  const devPlan = route?.params?.devPlan || null;

  const isDev = useMemo(() => developerUnlocked && isDeveloperUser(user), [developerUnlocked, user?.email]);
  const canCreate = useMemo(() => {
    if (!user) return false;
    if (isAdminOrBusiness(user.role)) return true;
    return isDev;
  }, [user?.id, user?.role, isDev]);

  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState(null);

  const [ownerBusinessName, setOwnerBusinessName] = useState("");
  const [ownerCategory, setOwnerCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("<p></p>");
  const [keywordsText, setKeywordsText] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [images, setImages] = useState([]);
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");

  const [planType, setPlanType] = useState(PLAN_TYPES.ENTRY);
  const [isPermanent, setIsPermanent] = useState(true);

  const [ownerUserIdOverride, setOwnerUserIdOverride] = useState("");

  // Developer-only fields
  const [rankingScore, setRankingScore] = useState("0");
  const [visibilityStatus, setVisibilityStatus] = useState(VISIBILITY_STATUS.ACTIVE);

  const canEditExisting = useMemo(() => {
    if (!existing || !user) return false;
    if (existing.ownerUserId === user.id) return true;
    return isDev;
  }, [existing?.postId, existing?.ownerUserId, user?.id, isDev]);

  const [quotaInfo, setQuotaInfo] = useState({ remaining: null, window: null, limit: null });

  async function refreshQuota(nextPlanType) {
    if (!user) return;
    const info = await actions.safeCall(
      () => getPlanQuotaInfo({ ownerUserId: user.id, planType: nextPlanType }),
      { title: "Quota" }
    );
    if (info) setQuotaInfo(info);
  }

  useEffect(() => {
    refreshQuota(planType);
  }, [user?.id, planType]);

  useEffect(() => {
    // Developer can preselect plan from the dev panel.
    if (mode === "create" && isDev && devPlan && Object.values(PLAN_TYPES).includes(devPlan)) {
      setPlanType(devPlan);
    }
  }, [mode, isDev, devPlan]);

  useEffect(() => {
    if (!cfg.PUBLIC_FEED_ENABLED) return;
    if (mode !== "edit" || !postId) return;

    let mounted = true;
    (async () => {
      const all = await actions.safeCall(() => listFeedPosts({ includeAllForDeveloper: isDev }), { title: "Feed" });
      const found = Array.isArray(all) ? all.find((p) => p.postId === postId) : null;
      if (!mounted) return;
      setExisting(found || null);
      if (found) {
        setOwnerUserIdOverride(found.ownerUserId || "");
        setOwnerBusinessName(found.ownerBusinessName || "");
        setOwnerCategory(found.ownerCategory || "");
        setTitle(found.title || "");
        setDescription(found.description || "");
        setKeywords(Array.isArray(found.keywords) ? found.keywords : []);
        setKeywordsText("");
        setImages(Array.isArray(found.images) ? found.images : []);
        setCity(found.location?.city || "");
        setRegion(found.location?.region || "");
        setPlanType(found.planType || PLAN_TYPES.ENTRY);
        setIsPermanent(!!found.isPermanent);
        setRankingScore(String(found.rankingScore || 0));
        setVisibilityStatus(found.visibilityStatus || VISIBILITY_STATUS.ACTIVE);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [cfg.PUBLIC_FEED_ENABLED, mode, postId, isDev]);

  useEffect(() => {
    if (mode !== "create") return;
    if (!user) return;

    // Reasonable defaults for business/admin based on profile.
    if (isAdminOrBusiness(user.role)) {
      if (!ownerBusinessName) setOwnerBusinessName(String(user.storefrontBusinessName || user.fullName || "").trim());
      if (!ownerCategory) setOwnerCategory(String(user.storefrontCategory || "").trim());
      if (!city) setCity(String(user.storefrontCity || "").trim());
      if (!region) setRegion(String(user.storefrontRegion || "").trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, user?.id]);

  function addKeyword() {
    const raw = keywordsText.trim().toLowerCase();
    if (!raw) return;
    if (raw.length > 24) return;
    if (keywords.includes(raw)) return;
    const next = [...keywords, raw].slice(0, 10);
    setKeywords(next);
    setKeywordsText("");
  }

  async function pickImage() {
    if (images.length >= 3) return;

    const perm = await actions.safeCall(() => ImagePicker.requestMediaLibraryPermissionsAsync(), { title: "Photos" });
    if (!perm?.granted) return;

    const res = await actions.safeCall(
      () => ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, base64: true }),
      { title: "Image" }
    );
    if (!res || res.canceled) return;
    const a = res.assets && res.assets[0] ? res.assets[0] : null;
    if (!a?.base64) return;

    const uri = `data:${a.mimeType || "image/jpeg"};base64,${a.base64}`;
    const next = [...images, { uri }].slice(0, 3);
    setImages(next);
  }

  function removeImage(idx) {
    setImages(images.filter((_, i) => i !== idx));
  }

  async function save() {
    if (!cfg.PUBLIC_FEED_ENABLED) return;
    if (!user) return;

    if (mode === "create" && !canCreate) return;
    if (mode === "edit" && !canEditExisting) return;

    // Location gating: business/admin must complete storefront address before publishing.
    if (!isDev && isAdminOrBusiness(user.role)) {
      const missing = getStorefrontAddressMissingFields(user);
      if (missing.length > 0) {
        Alert.alert("Storefront required", "Complete your business address in Profile before publishing posts.");
        return;
      }
    }

    setLoading(true);

    const profileCity = normalizeStorefrontField(user.storefrontCity);
    const profileRegion = normalizeStorefrontField(user.storefrontRegion);
    const profileCountry = normalizeStorefrontField(user.storefrontCountry);
    const profileStreetAddress = normalizeStorefrontField(user.storefrontStreetAddress);
    const profileStreetNumber = normalizeStorefrontField(user.storefrontStreetNumber);
    const locationCity = normalizeStorefrontField(city) || profileCity;
    const locationRegion = normalizeStorefrontField(region) || profileRegion;
    const location =
      locationCity || locationRegion
        ? {
            city: locationCity,
            region: locationRegion,
            country: profileCountry || undefined,
            streetAddress: profileStreetAddress || undefined,
            streetNumber: profileStreetNumber || undefined,
            lat: user.storefrontLat != null ? Number(user.storefrontLat) : undefined,
            lng: user.storefrontLng != null ? Number(user.storefrontLng) : undefined,
          }
        : null;

    const payload = {
      ownerBusinessName,
      ownerCategory,
      title,
      description,
      keywords,
      images,
      planType,
      isPermanent,
      location,
    };

    const res = await actions.safeCall(async () => {
      if (mode === "create") {
        return createFeedPost({
          actor: user,
          asOwnerUserId: isDev && ownerUserIdOverride.trim() ? ownerUserIdOverride.trim() : user.id,
          post: payload,
          allowDeveloperOverride: isDev,
        });
      }

      return updateFeedPost({
        actor: user,
        postId,
        patch: {
          ...payload,
          ...(isDev && ownerUserIdOverride.trim() ? { ownerUserId: ownerUserIdOverride.trim() } : null),
          rankingScore: isDev ? Number(rankingScore || 0) : undefined,
          visibilityStatus: isDev ? visibilityStatus : undefined,
        },
        allowDeveloperOverride: isDev,
      });
    }, { title: "Save" });

    setLoading(false);

    if (res?.ok) {
      navigation.goBack();
      return;
    }

    if (res && res.ok === false && res.reason) {
      Alert.alert("Limit", res.reason);
    }
  }

  async function del() {
    if (!existing || !user) return;
    setLoading(true);
    const res = await actions.safeCall(
      () => deleteFeedPost({ actor: user, postId: existing.postId, allowDeveloperOverride: isDev }),
      { title: "Delete" }
    );
    setLoading(false);
    if (res?.ok) navigation.goBack();
  }

  if (!cfg.PUBLIC_FEED_ENABLED) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.titleTop}>Post editor</Text>
          <Text style={styles.muted}>Public feed is disabled in this mode.</Text>
          <Button title="Back" variant="secondary" onPress={() => navigation.goBack()} />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.titleTop}>{mode === "create" ? "Create post" : "Edit post"}</Text>

        {mode === "create" && quotaInfo?.remaining != null ? (
          <Text style={styles.muted}>Remaining posts for this plan: {quotaInfo.remaining} ({quotaInfo.window})</Text>
        ) : null}

        <Card style={styles.card}>
          <TextField label="Business name" value={ownerBusinessName} onChangeText={setOwnerBusinessName} placeholder="Your business" />

          <TextField label="Category" value={ownerCategory} onChangeText={setOwnerCategory} placeholder="lawyer, accountant, artisan..." />
          <View style={styles.presetRow}>
            {CATEGORY_PRESETS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setOwnerCategory(c)}
                style={({ pressed }) => [styles.presetChip, pressed ? { opacity: 0.85 } : null]}
              >
                <Text style={styles.presetText}>{c}</Text>
              </Pressable>
            ))}
          </View>

          <TextField label="City (optional)" value={city} onChangeText={setCity} placeholder="City" />
          <TextField label="Region (optional)" value={region} onChangeText={setRegion} placeholder="Region" />

          <TextField label="Title" value={title} onChangeText={setTitle} placeholder="Short title" />

          <Text style={styles.label}>Description</Text>
          <FeedRichTextEditor valueHtml={description} onChangeHtml={setDescription} />

          <View style={{ height: theme.spacing.md }} />
          <Text style={styles.label}>Keywords</Text>
          <View style={styles.keywordRow}>
            <View style={{ flex: 1 }}>
              <TextField value={keywordsText} onChangeText={setKeywordsText} placeholder="Add keyword" />
            </View>
            <Pressable onPress={addKeyword} style={({ pressed }) => [styles.iconBtn, pressed ? { opacity: 0.85 } : null]}>
              <Ionicons name="add" size={18} color={theme.colors.primary} />
            </Pressable>
          </View>
          <View style={styles.chips}>
            {keywords.map((k) => (
              <Pressable key={k} onPress={() => setKeywords(keywords.filter((x) => x !== k))} style={({ pressed }) => [styles.chip, pressed ? { opacity: 0.85 } : null]}>
                <Text style={styles.chipText}>#{k}  ×</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { marginTop: theme.spacing.md }]}>Plan</Text>
          <View style={styles.planRow}>
            {Object.values(PLAN_TYPES).map((p) => {
              const disabled = p === PLAN_TYPES.WELCOME && !isDev;
              const selected = planType === p;
              return (
                <Pressable
                  key={p}
                  disabled={disabled}
                  onPress={() => setPlanType(p)}
                  style={({ pressed }) => [styles.planChip, selected ? styles.planChipOn : null, disabled ? { opacity: 0.45 } : null, pressed ? { opacity: 0.9 } : null]}
                >
                  <Text style={[styles.planText, selected ? styles.planTextOn : null]}>{p}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.muted}>Plan limits are enforced. BASIC expires after 30 days. WELCOME is developer-controlled.</Text>

          {isDev ? (
            <>
              <View style={{ height: theme.spacing.md }} />
              <TextField
                label="Owner userId (dev)"
                value={ownerUserIdOverride}
                onChangeText={setOwnerUserIdOverride}
                placeholder={user?.id ? `Default: ${user.id}` : "u_..."}
                autoCapitalize="none"
              />
              <TextField label="Ranking score (dev)" value={rankingScore} onChangeText={setRankingScore} keyboardType="numeric" />
              <TextField
                label="Visibility (dev)"
                value={visibilityStatus}
                onChangeText={(v) => setVisibilityStatus(v)}
                placeholder="ACTIVE | PAUSED | EXPIRED"
              />
            </>
          ) : null}

          <Button title={mode === "create" ? "Create" : "Save"} onPress={save} loading={loading} disabled={loading || (mode === "create" && !canCreate)} />
          {mode === "edit" && canEditExisting ? (
            <View style={{ marginTop: theme.spacing.sm }}>
              <Button title="Delete" variant="danger" onPress={del} disabled={loading} />
            </View>
          ) : null}
        </Card>

        <Button title="Back" variant="secondary" onPress={() => navigation.goBack()} />
      </ScrollView>
    </Screen>
  );
}


function makeStyles(theme) {
  return StyleSheet.create({
    content: {
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
    },
    titleTop: {
      ...theme.typography.h2,
      color: theme.colors.text,
    },
    muted: {
      ...theme.typography.small,
      color: theme.colors.mutedText,
      marginTop: 6,
    },
    card: {
      marginTop: theme.spacing.md,
    },
    label: {
      ...theme.typography.small,
      color: theme.colors.mutedText,
      marginBottom: theme.spacing.sm,
    },
    keywordRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: theme.spacing.sm,
    },
    iconBtn: {
      width: 44,
      height: 44,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.chipBg,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 18,
    },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.xs,
      marginTop: -theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    chip: {
      backgroundColor: theme.colors.chipBg,
      borderRadius: theme.radius.pill,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 7,
    },
    chipText: {
      ...theme.typography.small,
      color: theme.colors.text,
    },
    planRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.xs,
    },
    planChip: {
      backgroundColor: theme.colors.chipBg,
      borderRadius: theme.radius.pill,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 8,
    },
    planChipOn: {
      backgroundColor: theme.colors.primary,
    },
    planText: {
      ...theme.typography.small,
      color: theme.colors.text,
    },
    planTextOn: {
      color: theme.colors.primaryText,
    },
    presetRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.md,
      marginTop: -theme.spacing.sm,
    },
    presetChip: {
      backgroundColor: theme.colors.chipBg,
      borderRadius: theme.radius.pill,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 6,
    },
    presetText: {
      ...theme.typography.small,
      color: theme.colors.text,
    },
  });
}
