import Constants from "expo-constants";

function readExtra(key) {
  const extra = Constants?.expoConfig?.extra || Constants?.manifest?.extra || {};
  return extra ? extra[key] : undefined;
}

function parseBool(v, fallback) {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true" || s === "1" || s === "yes" || s === "on") return true;
    if (s === "false" || s === "0" || s === "no" || s === "off") return false;
  }
  return fallback;
}

function readEnv(key) {
  if (typeof process === "undefined") return undefined;
  if (!process?.env) return undefined;
  return process.env[key];
}

export function getFeatureFlags({ backendMode } = {}) {
  const isMock = backendMode === "MOCK";

  const useGoogleMaps = parseBool(
    readEnv("EXPO_PUBLIC_USE_GOOGLE_MAPS") ?? readExtra("USE_GOOGLE_MAPS"),
    false
  );

  const enableRatings = parseBool(
    readEnv("EXPO_PUBLIC_ENABLE_RATINGS") ?? readExtra("ENABLE_RATINGS"),
    true
  );

  const enableDevPanel = parseBool(
    readEnv("EXPO_PUBLIC_ENABLE_DEV_PANEL") ?? readExtra("ENABLE_DEV_PANEL"),
    true
  );

  return {
    BACKEND_MODE: isMock ? "MOCK" : "LIVE",
    USE_GOOGLE_MAPS: useGoogleMaps,
    ENABLE_RATINGS: enableRatings,
    ENABLE_DEV_PANEL: enableDevPanel,
  };
}
