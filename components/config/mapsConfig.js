import Constants from "expo-constants";
import { getFeatureFlags } from "./featureFlags";

function readExtra(key) {
  const extra = Constants?.expoConfig?.extra || Constants?.manifest?.extra || {};
  return extra ? extra[key] : undefined;
}

function readEnv(key) {
  if (typeof process === "undefined") return undefined;
  if (!process?.env) return undefined;
  return process.env[key];
}

export function getMapsConfig({ backendMode } = {}) {
  const flags = getFeatureFlags({ backendMode });
  const googleMapsApiKey =
    readEnv("EXPO_PUBLIC_GOOGLE_MAPS_API_KEY") ?? readExtra("GOOGLE_MAPS_API_KEY") ?? "";

  return {
    useGoogleMaps: !!flags.USE_GOOGLE_MAPS,
    googleMapsApiKey: String(googleMapsApiKey || ""),
  };
}
