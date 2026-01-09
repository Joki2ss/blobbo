// @ts-nocheck
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Screen } from "../components/Screen";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { useTheme } from "../theme";
import { useAppActions, useAppState } from "../store/AppStore";
import { resolveProTemplate } from "../services/templateResolver";
import { saveProOnboardingResult } from "../services/onboardingService";
import { isAdminOrBusiness } from "../utils/roles";

type Step = 0 | 1 | 2 | 3;

const Q1 = [
  "Restaurant / Café",
  "Lawyer / Legal",
  "Accountant / Tax",
  "Medical / Health",
  "Consultant / Coach",
  "Artisan / Local business",
  "IT / Digital services",
  "Other",
];

const Q2 = ["Appointments", "Messages", "Documents", "Walk-in", "Mixed"];
const Q3 = ["Rarely", "Weekly", "Frequently"];
const Q4 = ["Solo", "Small team", "Structured staff"];

export function ProOnboardingQuizScreen() {
  const { backendMode, session } = useAppState();
  const actions = useAppActions();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const user = session?.user;

  // Security: only Pro roles can access.
  const allowed =
    isAdminOrBusiness(user?.role) ||
    String(user?.role || "").toUpperCase() === "DEVELOPER";

  const [step, setStep] = useState<Step>(0);
  const [activityType, setActivityType] = useState("");
  const [contactStyle, setContactStyle] = useState("");
  const [publishFrequency, setPublishFrequency] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [saving, setSaving] = useState(false);

  const canNext = useMemo(() => {
    if (step === 0) return !!activityType;
    if (step === 1) return !!contactStyle;
    if (step === 2) return !!publishFrequency;
    if (step === 3) return !!teamSize;
    return false;
  }, [step, activityType, contactStyle, publishFrequency, teamSize]);

  async function finish() {
    setSaving(true);
    const answers = { activityType, contactStyle, publishFrequency, teamSize };
    const result = resolveProTemplate(answers);

    await actions.safeCall(
      () =>
        saveProOnboardingResult({
          backendMode,
          actions,
          result,
          answers,
          reason: "pro_onboarding",
        }),
      { title: "Onboarding" }
    );

    setSaving(false);
  }

  if (!allowed) {
    return (
      <Screen>
        <View style={styles.container}>
          <Text style={styles.title}>Not available</Text>
          <Text style={styles.subtitle}>
            This onboarding is restricted to Pro accounts.
          </Text>
        </View>
      </Screen>
    );
  }

  const question =
    step === 0
      ? {
          title: "What best describes your activity?",
          options: Q1,
          value: activityType,
          onSelect: setActivityType,
        }
      : step === 1
      ? {
          title: "How do customers usually contact you?",
          options: Q2,
          value: contactStyle,
          onSelect: setContactStyle,
        }
      : step === 2
      ? {
          title: "How often do you publish updates or promotions?",
          options: Q3,
          value: publishFrequency,
          onSelect: setPublishFrequency,
        }
      : {
          title: "Do you work alone or with a team?",
          options: Q4,
          value: teamSize,
          onSelect: setTeamSize,
        };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.kicker}>Pro onboarding</Text>
        <Text style={styles.title}>{question.title}</Text>

        <Card style={styles.card}>
          {question.options.map((opt) => {
            const selected = question.value === opt;
            return (
              <Pressable
                key={opt}
                onPress={() => question.onSelect(opt)}
                style={({ pressed }) => [
                  styles.option,
                  selected ? styles.optionActive : null,
                  pressed ? { opacity: 0.92 } : null,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    selected ? styles.optionTextActive : null,
                  ]}
                >
                  {opt}
                </Text>
              </Pressable>
            );
          })}
        </Card>

        <View style={styles.navRow}>
          <Button
            title="Back"
            variant="secondary"
            onPress={() => setStep((s) => (s > 0 ? ((s - 1) as Step) : s))}
            disabled={step === 0 || saving}
          />
          <Button
            title={step === 3 ? "Finish" : "Next"}
            onPress={() => {
              if (!canNext || saving) return;
              if (step === 3) return finish();
              setStep((s) => (s + 1) as Step);
            }}
            disabled={!canNext || saving}
            loading={saving}
          />
        </View>

        <Text style={styles.progress}>{step + 1} / 4</Text>
      </ScrollView>
    </Screen>
  );
}

function makeStyles(theme: any) {
  return StyleSheet.create({
    container: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: theme.spacing.xl,
      paddingBottom: theme.spacing.xl,
    },
    kicker: {
      ...(theme.typography.small || {}),
      color: theme.colors.mutedText,
      marginBottom: theme.spacing.sm,
    },
    title: {
      ...(theme.typography.h1 || {}),
      color: theme.colors.text,
    },
    subtitle: {
      ...(theme.typography.body || {}),
      color: theme.colors.mutedText,
      marginTop: theme.spacing.sm,
    },
    card: {
      marginTop: theme.spacing.lg,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    option: {
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      marginBottom: theme.spacing.sm,
    },
    optionActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.chipBg,
    },
    optionText: {
      ...(theme.typography.body || {}),
      color: theme.colors.text,
      fontWeight: "700",
    },
    optionTextActive: {
      color: theme.colors.primary,
    },
    navRow: {
      marginTop: theme.spacing.md,
      flexDirection: "row",
      gap: theme.spacing.md,
      justifyContent: "space-between",
    },
    progress: {
      marginTop: theme.spacing.md,
      ...(theme.typography.small || {}),
      color: theme.colors.mutedText,
      textAlign: "center",
    },
  });
}
