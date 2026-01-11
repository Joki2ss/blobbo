import React, { useState } from "react";
import { View, Text, Switch, StyleSheet } from "react-native";
import { useTheme } from "../styles/useTheme";

export default function GDPRConsent({ onConsentChange }) {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const [consent, setConsent] = useState(false);

  function handleToggle(value) {
    setConsent(value);
    if (onConsentChange) onConsentChange(value);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>I consent to data processing (GDPR)</Text>
      <Switch
        value={consent}
        onValueChange={handleToggle}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor={consent ? theme.colors.primary : theme.colors.card}
      />
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 12,
    },
    text: {
      fontSize: 14,
      color: theme.colors.text,
      marginRight: 12,
    },
  });
}
