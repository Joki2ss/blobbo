import React, { useEffect, useMemo, useRef } from "react";
import { Alert, Platform } from "react-native";

import { useAppState } from "../store/AppStore";
import { compareSemver, isSemverLessThan } from "../utils/semver";
import { openPlayStoreListing } from "../utils/playStore";
import { cloudGetAppUpdateConfig, getAppVersion } from "../services/cloudAppUpdateService";
import { getDismissedLatestVersion, setDismissedLatestVersion } from "../services/updatePromptStore";

function safeTitle() {
  return "Update available";
}

function safeBody({ latestVersion, force }) {
  if (force) return "A newer version is required to continue. Please update now.";
  return latestVersion
    ? `A newer version (${latestVersion}) is available. Update now for the best experience.`
    : "A newer version is available. Update now for the best experience.";
}

export function GlobalUpdateGate() {
  const { backendMode } = useAppState();
  const mountedRef = useRef(true);
  const shownRef = useRef(false);

  const shouldRun = useMemo(() => {
    // In production we expect CLOUD; in MOCK mode avoid noise and avoid dependency on Supabase.
    return backendMode === "CLOUD" && Platform.OS === "android";
  }, [backendMode]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!shouldRun) return;
    if (shownRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        const currentVersion = getAppVersion();
        if (!currentVersion) return;

        const cfg = await cloudGetAppUpdateConfig();
        if (!cfg?.updateEnabled) return;

        const latest = cfg.latestVersion;
        const min = cfg.minVersion;

        // If config is malformed, fail closed (no alert) to avoid false blocks.
        if (!latest || !min) return;

        // Already up-to-date -> never show.
        if (compareSemver(currentVersion, latest) >= 0) return;

        const dismissedLatest = await getDismissedLatestVersion();
        if (dismissedLatest && String(dismissedLatest) === String(latest)) {
          // User already chose "Later" for this specific latest version.
          return;
        }

        const mustForce = isSemverLessThan(currentVersion, min) || !!cfg.forceUpdate;
        if (cancelled || !mountedRef.current) return;

        shownRef.current = true;

        const buttons = [];

        if (!mustForce) {
          buttons.push({
            text: "Later",
            style: "cancel",
            onPress: async () => {
              try {
                await setDismissedLatestVersion(latest);
              } catch {
                // ignore
              }
            },
          });
        }

        buttons.push({
          text: "Update now",
          onPress: async () => {
            await openPlayStoreListing();
          },
        });

        Alert.alert(safeTitle(), safeBody({ latestVersion: latest, force: mustForce }), buttons, {
          cancelable: !mustForce,
        });
      } catch {
        // Silent failure: update gate must never crash the app.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shouldRun]);

  return null;
}
