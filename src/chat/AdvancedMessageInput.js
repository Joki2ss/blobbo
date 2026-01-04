import React, { useMemo, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import DateTimePicker from "@react-native-community/datetimepicker";

import { useTheme } from "../theme";

const MAX_MEDIA = 3;

export function AdvancedMessageInput({
  backendMode,
  value,
  onChange,
  onSend,
  disabled,
  editing,
  onCancelEditing,
}) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [media, setMedia] = useState([]);
  const [location, setLocation] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(null);

  const canAttachVideo = backendMode === "MOCK";

  const canSend = useMemo(() => {
    const t = String(value || "").trim();
    return !disabled && (t.length > 0 || media.length > 0 || !!location);
  }, [value, media.length, location, disabled]);

  async function pickMedia() {
    if (media.length >= MAX_MEDIA) return;

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm?.granted) return;

    const types = canAttachVideo ? ImagePicker.MediaTypeOptions.All : ImagePicker.MediaTypeOptions.Images;

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: types,
      quality: 0.8,
      base64: true,
      videoMaxDuration: 15,
    });
    if (!res || res.canceled) return;
    const a = res.assets && res.assets[0] ? res.assets[0] : null;
    if (!a?.uri) return;

    const isVideo = a.type === "video";
    if (isVideo && !canAttachVideo) {
      Alert.alert("Media", "Video is disabled in LIVE mode.");
      return;
    }

    const item = {
      uri: a.base64 ? `data:${a.mimeType || (isVideo ? "video/mp4" : "image/jpeg")};base64,${a.base64}` : a.uri,
      type: isVideo ? "video" : "image",
    };

    setMedia((prev) => [...prev, item].slice(0, MAX_MEDIA));
  }

  async function shareLocation() {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm?.granted) {
      Alert.alert("Location", "Permission denied.");
      return;
    }
    const pos = await Location.getCurrentPositionAsync({});
    const lat = pos?.coords?.latitude;
    const lng = pos?.coords?.longitude;
    if (typeof lat !== "number" || typeof lng !== "number") return;

    const link = `https://maps.google.com/?q=${lat},${lng}`;
    setLocation({ latitude: lat, longitude: lng, link });
  }

  function openSchedule() {
    setShowPicker(true);
  }

  function handleKeyPress(e) {
    // Web/hardware keyboard: Enter sends, Shift+Enter newline.
    const key = e?.nativeEvent?.key;
    const shift = !!e?.nativeEvent?.shiftKey;

    if (key !== "Enter") return;

    // On web we can enforce the requested behavior.
    if (Platform.OS === "web") {
      if (shift) {
        onChange((value || "") + "\n");
        return;
      }
      e?.preventDefault?.();
      trySend();
    }
  }

  function trySend() {
    if (!canSend) return;

    const payload = {
      text: String(value || ""),
      media: media.slice(0, MAX_MEDIA),
      location,
      scheduledAt,
    };

    onSend?.(payload);

    setMedia([]);
    setLocation(null);
    setScheduledAt(null);
  }

  function removeMedia(idx) {
    setMedia((prev) => prev.filter((_, i) => i !== idx));
  }

  function clearLocation() {
    setLocation(null);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.actionsRow}>
        <IconBtn theme={theme} styles={styles} name="image" onPress={pickMedia} disabled={disabled || media.length >= MAX_MEDIA} />
        <IconBtn theme={theme} styles={styles} name="location" onPress={shareLocation} disabled={disabled} />
        <IconBtn theme={theme} styles={styles} name="calendar" onPress={openSchedule} disabled={disabled} />

        <View style={{ flex: 1 }} />
        {editing ? (
          <Pressable onPress={onCancelEditing} style={({ pressed }) => [styles.editChip, pressed ? { opacity: 0.85 } : null]}>
            <Text style={styles.editText}>Cancel edit</Text>
          </Pressable>
        ) : null}
      </View>

      {media.length > 0 ? (
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Media: {media.length}/{MAX_MEDIA}</Text>
          <View style={{ flexDirection: "row", gap: theme.spacing.xs }}>
            {media.map((m, idx) => (
              <Pressable key={idx} onPress={() => removeMedia(idx)} style={({ pressed }) => [styles.metaChip, pressed ? { opacity: 0.85 } : null]}>
                <Text style={styles.metaChipText}>{m.type === "video" ? "video" : "img"} ×</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {location ? (
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Location attached</Text>
          <Pressable onPress={clearLocation} style={({ pressed }) => [styles.metaChip, pressed ? { opacity: 0.85 } : null]}>
            <Text style={styles.metaChipText}>Remove ×</Text>
          </Pressable>
        </View>
      ) : null}

      {scheduledAt ? (
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Scheduled: {new Date(scheduledAt).toLocaleString()}</Text>
          <Pressable onPress={() => setScheduledAt(null)} style={({ pressed }) => [styles.metaChip, pressed ? { opacity: 0.85 } : null]}>
            <Text style={styles.metaChipText}>Clear ×</Text>
          </Pressable>
        </View>
      ) : null}

      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={editing ? "Edit scheduled message" : "Message"}
        placeholderTextColor={theme.colors.mutedText}
        editable={!disabled}
        multiline
        onKeyPress={handleKeyPress}
        blurOnSubmit={Platform.OS !== "web"}
        returnKeyType="send"
        onSubmitEditing={() => {
          // Mobile: send on Enter
          if (Platform.OS !== "web") trySend();
        }}
        style={[styles.input, disabled ? { opacity: 0.7 } : null]}
      />

      {showPicker ? (
        <DateTimePicker
          value={new Date(Date.now() + 5 * 60 * 1000)}
          mode="datetime"
          onChange={(e, date) => {
            setShowPicker(false);
            if (!date) return;
            const ms = date.getTime();
            if (ms <= Date.now()) {
              Alert.alert("Schedule", "Pick a future time.");
              return;
            }
            setScheduledAt(ms);
          }}
        />
      ) : null}

      <Text style={styles.hint}>
        Enter to send. Shift+Enter for new line (web/hardware).
      </Text>
    </View>
  );
}

function IconBtn({ theme, styles, name, onPress, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.iconBtn, disabled ? { opacity: 0.4 } : null, pressed && !disabled ? { opacity: 0.85 } : null]}
    >
      <Ionicons name={icon(name)} size={18} color={theme.colors.text} />
    </Pressable>
  );
}

function icon(name) {
  switch (name) {
    case "image":
      return "image-outline";
    case "location":
      return "location-outline";
    case "calendar":
      return "calendar-outline";
    default:
      return "ellipse-outline";
  }
}


function makeStyles(theme) {
  return StyleSheet.create({
    wrap: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.lg,
      backgroundColor: theme.colors.bg,
    },
    actionsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    iconBtn: {
      width: 34,
      height: 34,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.chipBg,
      alignItems: "center",
      justifyContent: "center",
    },
    input: {
      minHeight: 44,
      maxHeight: 140,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      ...theme.typography.body,
      color: theme.colors.text,
    },
    hint: {
      marginTop: 8,
      ...theme.typography.small,
      color: theme.colors.mutedText,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    metaText: {
      ...theme.typography.small,
      color: theme.colors.mutedText,
    },
    metaChip: {
      backgroundColor: theme.colors.chipBg,
      borderRadius: theme.radius.pill,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 6,
    },
    metaChipText: {
      ...theme.typography.small,
      color: theme.colors.text,
    },
    editChip: {
      backgroundColor: theme.colors.chipBg,
      borderRadius: theme.radius.pill,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 6,
    },
    editText: {
      ...theme.typography.small,
      color: theme.colors.text,
    },
  });
}
