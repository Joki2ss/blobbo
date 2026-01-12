import React, { useEffect, useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../../components/Screen";
import { Header } from "../../components/Header";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { MapContainer } from "../../components/MapContainer";
import { useTheme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";
import { formatStorefrontAddress } from "../../storefront/storefrontValidation";
import { getFeatureFlags } from "../../config/featureFlags";
import { getMapsConfig } from "../../config/mapsConfig";
import { getRatingAggregate, submitRating } from "../../services/ratingsService";

export function PublicStorefrontScreen({ navigation, route }) {
  const { backendMode, session } = useAppState();
  const actions = useAppActions();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const flags = useMemo(() => getFeatureFlags({ backendMode }), [backendMode]);
  const maps = useMemo(() => getMapsConfig({ backendMode }), [backendMode]);

  const userId = route?.params?.userId || "";
  const [item, setItem] = useState(null);
  const [agg, setAgg] = useState(null);
  const [myRating, setMyRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  async function refresh() {
    const res = await actions.safeCall(() => actions.backend.users.getPublicStorefrontById({ userId }), {
      title: "Storefront",
    });
    if (res) setItem(res);
  }

  useEffect(() => {
    refresh();
  }, [backendMode, userId]);

  useEffect(() => {
    if (!flags.ENABLE_RATINGS) return;
    if (!item?.id) return;
    (async () => {
      const a = await actions.safeCall(
        () =>
          getRatingAggregate({
            backendMode,
            backendRatings: actions.backend.ratings,
            businessId: item.id,
          }),
        { title: "Ratings" }
      );
      if (a) setAgg(a);
    })();
  }, [flags.ENABLE_RATINGS, backendMode, item?.id]);

  const title = item?.storefrontBusinessName || item?.fullName || "Storefront";

  const marker = useMemo(() => {
    const lat = typeof item?.storefrontLat === "number" ? item.storefrontLat : Number(item?.storefrontLat);
    const lng = typeof item?.storefrontLng === "number" ? item.storefrontLng : Number(item?.storefrontLng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];
    return [{ id: item?.id || userId, lat, lng, title }];
  }, [item?.id, item?.storefrontLat, item?.storefrontLng, title, userId]);

  function openInMaps() {
    const m = marker[0];
    if (!m) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${m.lat},${m.lng}`)}`;
    Linking.openURL(url);
  }

  async function submit() {
    const actorId = session?.user?.id || "";
    if (!actorId) {
      navigation.navigate("Login");
      return;
    }
    if (!item?.id) return;
    if (!myRating) return;

    setSubmitting(true);
    const res = await actions.safeCall(
      () =>
        submitRating({
          backendMode,
          backendRatings: actions.backend.ratings,
          actorId,
          businessId: item.id,
          ratingValue: myRating,
          answers: {},
        }),
      { title: "Rate" }
    );
    setSubmitting(false);
    if (res?.aggregate) setAgg(res.aggregate);
    setMyRating(0);
  }

  return (
    <Screen>
      <Header title={title} subtitle={item?.storefrontCategory || ""} />
      <ScrollView contentContainerStyle={styles.content}>
        {marker.length ? (
          <Card style={styles.card}>
            <Text style={styles.section}>Location</Text>
            <View style={{ height: theme.spacing.sm }} />
            <MapContainer
              style={styles.mapSquare}
              markers={marker}
              useGoogleMaps={flags.USE_GOOGLE_MAPS && !!maps.googleMapsApiKey}
              googleMapsApiKey={maps.googleMapsApiKey}
              onMarkerPress={() => {}}
            />
            <View style={{ height: theme.spacing.sm }} />
            <Button title="Open in Maps" variant="secondary" onPress={openInMaps} />
          </Card>
        ) : null}

        <Card style={styles.card}>
          <Text style={styles.section}>Address</Text>
          <Text style={styles.muted}>{formatStorefrontAddress(item)}</Text>
          {item?.storefrontVatNumber ? (
            <>
              <View style={{ height: theme.spacing.md }} />
              <Text style={styles.section}>VAT</Text>
              <Text style={styles.muted}>{item.storefrontVatNumber}</Text>
            </>
          ) : null}
        </Card>

        {flags.ENABLE_RATINGS ? (
          <Card style={styles.card}>
            <Text style={styles.section}>Ratings</Text>
            <Text style={styles.muted}>{agg ? `${agg.avgRating} / 5 • ${agg.countTotal} total` : "No ratings yet."}</Text>

            <View style={{ height: theme.spacing.md }} />
            <Text style={styles.muted}>Your rating (anonymous to the public)</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable
                  key={n}
                  onPress={() => setMyRating(n)}
                  style={({ pressed }) => [styles.starBtn, pressed ? { opacity: 0.85 } : null]}
                >
                  <Ionicons
                    name={myRating >= n ? "star" : "star-outline"}
                    size={20}
                    color={myRating >= n ? theme.colors.primary : theme.colors.mutedText}
                  />
                </Pressable>
              ))}
            </View>
            <Button
              title={submitting ? "Submitting..." : session?.user ? "Submit rating" : "Login to rate"}
              onPress={submit}
              disabled={submitting || (session?.user && !myRating)}
            />
          </Card>
        ) : null}

        <Card style={styles.card}>
          <Text style={styles.section}>Booking</Text>
          <Text style={styles.muted}>Booking options can be attached to posts or to this profile (coming next).</Text>
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
    card: {
      marginBottom: theme.spacing.md,
    },
    mapSquare: {
      height: 160,
    },
    section: {
      ...theme.typography.h3,
      color: theme.colors.text,
    },
    muted: {
      ...theme.typography.small,
      color: theme.colors.mutedText,
      marginTop: 6,
    },
    starsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    starBtn: {
      padding: 10,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.chipBg,
    },
  });
}
