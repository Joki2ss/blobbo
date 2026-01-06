import React, { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Keyboard, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../components/Screen";
import { Header } from "../components/Header";
import { useTheme } from "../theme";
import { useAppActions, useAppState } from "../store/AppStore";
import { getFeatureFlags } from "../config/featureFlags";
import { getMapsConfig } from "../config/mapsConfig";
import { MapContainer } from "../components/MapContainer";
import { ProSearchBar } from "../components/ProSearchBar";
import { ProPreviewCard } from "../components/ProPreviewCard";
import { searchPublicProfiles } from "../services/profileService";
import { buildSuggestions, createInMemoryCache, createStaleRequestGuard, rankProfiles } from "../services/searchService";

export function FindAProScreen({ navigation }) {
  const { backendMode } = useAppState();
  const actions = useAppActions();
  const theme = useTheme();
  const dims = useWindowDimensions();

  const styles = useMemo(() => makeStyles(theme), [theme]);
  const flags = useMemo(() => getFeatureFlags({ backendMode }), [backendMode]);
  const maps = useMemo(() => getMapsConfig({ backendMode }), [backendMode]);

  const isDesktop = dims.width >= 1024;

  const inputRef = useRef(null);
  const cacheRef = useRef(createInMemoryCache({ maxEntries: 25, ttlMs: 60_000 }));
  const staleRef = useRef(createStaleRequestGuard());

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedId, setSelectedId] = useState("");

  const markers = useMemo(() => {
    return (Array.isArray(profiles) ? profiles : [])
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
      .map((p) => ({
        id: p.id,
        lat: p.lat,
        lng: p.lng,
        title: p.businessName,
        subtitle: [p.city, p.region].filter(Boolean).join(", "),
      }));
  }, [profiles]);

  const selected = useMemo(() => profiles.find((p) => p.id === selectedId) || null, [profiles, selectedId]);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        inputRef.current?.focus?.();
      } catch {
        // ignore
      }
    }, 200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const q = String(query || "").trim();
    const key = q.toLowerCase();
    const token = staleRef.current.next();

    const minChars = 2;
    const debounceMs = 250;

    const id = setTimeout(async () => {
      if (q.length > 0 && q.length < minChars) {
        if (staleRef.current.isCurrent(token)) {
          setSuggestions([]);
          setProfiles([]);
          setSelectedId("");
        }
        return;
      }

      const cached = cacheRef.current.get(key);
      if (cached && staleRef.current.isCurrent(token)) {
        setProfiles(cached.profiles);
        setSuggestions(cached.suggestions);
        return;
      }

      setLoading(true);
      const list = await actions.safeCall(
        () => searchPublicProfiles({ backendUsers: actions.backend.users, query: q, limit: 50 }),
        { title: "Find a Pro" }
      );

      if (!staleRef.current.isCurrent(token)) return;

      const normalized = Array.isArray(list) ? list : [];
      const ranked = q ? rankProfiles({ query: q, profiles: normalized }) : normalized;
      const sug = q ? buildSuggestions({ query: q, profiles: ranked, limit: 8 }) : [];

      cacheRef.current.set(key, { profiles: ranked, suggestions: sug });
      setProfiles(ranked);
      setSuggestions(sug);
      setSelectedId("");
      setLoading(false);
    }, debounceMs);

    return () => clearTimeout(id);
  }, [query, backendMode]);

  function openProfile(pro) {
    if (!pro?.id) return;
    Keyboard.dismiss();
    navigation.navigate("PublicStorefront", { userId: pro.id });
  }

  function onMarkerPress(m) {
    setSelectedId(String(m?.id || ""));
  }

  return (
    <Screen>
      <Header
        title="Find a Pro"
        subtitle="Search public professionals"
        right={
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.iconWrap, pressed ? { opacity: 0.85 } : null]}
          >
            <Ionicons name="close" size={18} color={theme.colors.primary} />
          </Pressable>
        }
      />

      <View style={[styles.container, isDesktop ? styles.containerDesktop : null]}>
        <View style={[styles.mapArea, isDesktop ? styles.mapDesktop : null]}>
          <MapContainer
            style={styles.map}
            markers={markers}
            useGoogleMaps={flags.USE_GOOGLE_MAPS && !!maps.googleMapsApiKey}
            googleMapsApiKey={maps.googleMapsApiKey}
            onMarkerPress={onMarkerPress}
          />

          <View style={[styles.searchOverlay, isDesktop ? styles.searchOverlayDesktop : null]}>
            <ProSearchBar
              value={query}
              onChangeText={(t) => setQuery(t)}
              inputRef={inputRef}
              suggestions={suggestions}
              onSelectSuggestion={(s) => {
                setQuery(s);
              }}
            />

            {loading ? (
              <Text style={styles.loading}>Searching…</Text>
            ) : null}
          </View>

          {!isDesktop && selected ? (
            <View style={styles.bottomSheet} pointerEvents="box-none">
              <ProPreviewCard pro={selected} variant="sheet" onViewProfile={() => openProfile(selected)} />
            </View>
          ) : null}
        </View>

        <View style={[styles.listArea, isDesktop ? styles.listDesktop : null]}>
          <FlatList
            data={profiles}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <ProPreviewCard
                pro={item}
                onViewProfile={() => openProfile(item)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.muted}>No professionals found.</Text>
                <Text style={styles.mutedSmall}>Profiles must be public and include coordinates.</Text>
              </View>
            }
          />
        </View>
      </View>
    </Screen>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    iconWrap: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 10,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.chipBg,
    },
    container: {
      flex: 1,
    },
    containerDesktop: {
      flexDirection: "row",
    },
    mapArea: {
      flex: 1,
      position: "relative",
      padding: theme.spacing.lg,
    },
    mapDesktop: {
      flex: 3,
    },
    listArea: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.lg,
    },
    listDesktop: {
      flex: 2,
      paddingTop: theme.spacing.lg,
      borderLeftWidth: 1,
      borderLeftColor: theme.colors.border,
    },
    map: {
      height: "100%",
      minHeight: 320,
    },
    searchOverlay: {
      position: "absolute",
      top: theme.spacing.lg,
      left: theme.spacing.lg,
      right: theme.spacing.lg,
    },
    searchOverlayDesktop: {
      right: theme.spacing.lg * 2,
    },
    loading: {
      ...theme.typography.small,
      color: theme.colors.mutedText,
      marginTop: theme.spacing.sm,
      marginLeft: theme.spacing.sm,
    },
    listContent: {
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
    },
    empty: {
      paddingVertical: theme.spacing.xl,
    },
    muted: {
      ...theme.typography.body,
      color: theme.colors.mutedText,
    },
    mutedSmall: {
      ...theme.typography.small,
      color: theme.colors.mutedText,
      marginTop: theme.spacing.sm,
    },
    bottomSheet: {
      position: "absolute",
      left: theme.spacing.lg,
      right: theme.spacing.lg,
      bottom: theme.spacing.lg,
    },
  });
}
