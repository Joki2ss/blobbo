import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, Switch } from "react-native";

import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { TextField } from "../../components/TextField";
import { Button } from "../../components/Button";
import { useTheme } from "../../theme";
import { useAppActions, useAppState } from "../../store/AppStore";
import { isAdminOrBusiness, isCustomerOrStaff } from "../../utils/roles";
import { getStorefrontAddressMissingFields, hasCompleteStorefrontAddress } from "../../storefront/storefrontValidation";

export function ProfileScreen({ navigation }) {
  const { session, workspace } = useAppState();
  const actions = useAppActions();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const user = session?.user;

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [photoUri, setPhotoUri] = useState(user?.photoUri || "");

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");

  const [storefrontBusinessName, setStorefrontBusinessName] = useState(user?.storefrontBusinessName || "");
  const [storefrontCategory, setStorefrontCategory] = useState(user?.storefrontCategory || "");
  const [storefrontVatNumber, setStorefrontVatNumber] = useState(user?.storefrontVatNumber || "");

  const [storefrontStreetAddress, setStorefrontStreetAddress] = useState(user?.storefrontStreetAddress || "");
  const [storefrontStreetNumber, setStorefrontStreetNumber] = useState(user?.storefrontStreetNumber || "");
  const [storefrontCity, setStorefrontCity] = useState(user?.storefrontCity || "");
  const [storefrontRegion, setStorefrontRegion] = useState(user?.storefrontRegion || "");
  const [storefrontCountry, setStorefrontCountry] = useState(user?.storefrontCountry || "");

  const [storefrontLat, setStorefrontLat] = useState(user?.storefrontLat != null ? String(user.storefrontLat) : "");
  const [storefrontLng, setStorefrontLng] = useState(user?.storefrontLng != null ? String(user.storefrontLng) : "");
  const [storefrontPublicEnabled, setStorefrontPublicEnabled] = useState(!!user?.storefrontPublicEnabled);

  const [requestedEmail, setRequestedEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const isCustomer = isCustomerOrStaff(user?.role);
  const isAdmin = isAdminOrBusiness(user?.role);

  const planLabel = useMemo(() => {
    return isCustomer ? "Customer plan: Lifetime Free" : "Admin account";
  }, [isCustomer]);

  async function saveProfile() {
    if (!workspace?.id || !user?.id) return;
    setSaving(true);

    const wantsPublic = !!storefrontPublicEnabled;
    const missing = wantsPublic ? getStorefrontAddressMissingFields({
      role: user?.role,
      storefrontStreetAddress,
      storefrontStreetNumber,
      storefrontCity,
      storefrontRegion,
      storefrontCountry,
    }) : [];

    if (wantsPublic && missing.length > 0) {
      setSaving(false);
      Alert.alert(
        "Storefront",
        "Complete the storefront address before enabling the public profile."
      );
      setStorefrontPublicEnabled(false);
      return;
    }

    const updated = await actions.safeCall(
      () =>
        actions.updateMyProfile({
          fullName,
          phone,
          photoUri,
          ...(isAdmin
            ? {
                firstName,
                lastName,
                storefrontBusinessName,
                storefrontCategory,
                storefrontVatNumber,
                storefrontStreetAddress,
                storefrontStreetNumber,
                storefrontCity,
                storefrontRegion,
                storefrontCountry,
                storefrontLat,
                storefrontLng,
                storefrontPublicEnabled,
              }
            : null),
        }),
      { title: "Profile" }
    );

    setSaving(false);
    if (updated) {
      const publicOk = !storefrontPublicEnabled || hasCompleteStorefrontAddress(updated);
      if (storefrontPublicEnabled && !publicOk) setStorefrontPublicEnabled(false);
      Alert.alert("Saved", "Profile updated.");
    }
  }

  async function requestEmailChange() {
    if (!workspace?.id || !user?.id) return;
    const next = requestedEmail.trim().toLowerCase();
    if (!next) {
      Alert.alert("Email", "Enter the new email you want to request.");
      return;
    }

    const res = await actions.safeCall(() => actions.requestEmailChange({ requestedEmail: next }), { title: "Request" });

    if (res?.ok) {
      Alert.alert("Requested", "Your request was sent to the admin queue.");
      setRequestedEmail("");
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>{planLabel}</Text>

        <Card style={styles.card}>
          <Text style={styles.section}>Basics</Text>
          <TextField label="Full name" value={fullName} onChangeText={setFullName} placeholder="Full name" />
          {isAdmin ? (
            <>
              <TextField label="First name (optional)" value={firstName} onChangeText={setFirstName} placeholder="Name" />
              <TextField label="Last name (optional)" value={lastName} onChangeText={setLastName} placeholder="Surname" />
            </>
          ) : null}
          <TextField label="Phone" value={phone} onChangeText={setPhone} placeholder="+1 ..." />
          <TextField
            label="Profile photo URL (optional)"
            value={photoUri}
            onChangeText={setPhotoUri}
            placeholder="https://..."
          />

          <TextField
            label="Email (login identifier)"
            value={user?.email || ""}
            onChangeText={() => {}}
            placeholder=""
            editable={false}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {isCustomer ? (
            <Text style={styles.notice}>Email changes require admin approval.</Text>
          ) : (
            <Text style={styles.notice}>Email is a login identifier (locked in this demo).</Text>
          )}

          <Button title="Save" onPress={saveProfile} loading={saving} />
        </Card>

        {isAdmin ? (
          <Card style={styles.card}>
            <Text style={styles.section}>Storefront</Text>
            <Text style={styles.notice}>Required for publishing posts: address + city/region/country.</Text>

            <TextField
              label="Business name"
              value={storefrontBusinessName}
              onChangeText={setStorefrontBusinessName}
              placeholder="Your business name"
            />
            <TextField label="Category" value={storefrontCategory} onChangeText={setStorefrontCategory} placeholder="lawyer, dentist, artisan..." />
            <TextField
              label="VAT / Partita IVA (optional)"
              value={storefrontVatNumber}
              onChangeText={setStorefrontVatNumber}
              placeholder="IT... or EU/extra-EU"
              autoCapitalize="characters"
            />

            <TextField label="Street address" value={storefrontStreetAddress} onChangeText={setStorefrontStreetAddress} placeholder="Via Roma" />
            <TextField label="Street number" value={storefrontStreetNumber} onChangeText={setStorefrontStreetNumber} placeholder="10" />
            <TextField label="City" value={storefrontCity} onChangeText={setStorefrontCity} placeholder="Milano" />
            <TextField label="Region / Province" value={storefrontRegion} onChangeText={setStorefrontRegion} placeholder="MI / Lombardia" />
            <TextField label="Country" value={storefrontCountry} onChangeText={setStorefrontCountry} placeholder="Italy" />

            <Text style={[styles.section, { marginTop: theme.spacing.md }]}>GPS (optional)</Text>
            <TextField label="Latitude" value={storefrontLat} onChangeText={setStorefrontLat} placeholder="45.4642" keyboardType="numeric" />
            <TextField label="Longitude" value={storefrontLng} onChangeText={setStorefrontLng} placeholder="9.1900" keyboardType="numeric" />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Public storefront (Map)</Text>
              <Switch value={storefrontPublicEnabled} onValueChange={setStorefrontPublicEnabled} />
            </View>
          </Card>
        ) : null}

        {isCustomer ? (
          <Card style={styles.card}>
            <Text style={styles.section}>Request email change</Text>
            <TextField label="New email" value={requestedEmail} onChangeText={setRequestedEmail} placeholder="new@email.com" />
            <Button title="Request" variant="secondary" onPress={requestEmailChange} />
          </Card>
        ) : null}

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
    title: {
      ...theme.typography.h1,
      color: theme.colors.text,
    },
    subtitle: {
      ...theme.typography.small,
      color: theme.colors.mutedText,
      marginTop: 6,
      marginBottom: theme.spacing.lg,
    },
    card: {
      marginBottom: theme.spacing.md,
    },
    section: {
      ...theme.typography.h3,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    notice: {
      ...theme.typography.small,
      color: theme.colors.mutedText,
      marginBottom: theme.spacing.md,
      marginTop: -4,
    },
    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: theme.spacing.md,
      paddingVertical: 6,
    },
    switchLabel: {
      ...theme.typography.body,
      color: theme.colors.text,
      flex: 1,
      marginRight: theme.spacing.md,
    },
  });
}
