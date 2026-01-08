import { Linking, Platform } from "react-native";
import Constants from "expo-constants";

function getAndroidPackageName() {
  const expoCfg = Constants?.expoConfig || Constants?.manifest || {};
  return expoCfg?.android?.package || expoCfg?.android?.applicationId || null;
}

export async function openPlayStoreListing({ packageName } = {}) {
  if (Platform.OS !== "android") return false;

  const pkg = String(packageName || getAndroidPackageName() || "").trim();
  if (!pkg) return false;

  // Prefer the Play Store app.
  const marketUrl = `market://details?id=${encodeURIComponent(pkg)}`;
  const webUrl = `https://play.google.com/store/apps/details?id=${encodeURIComponent(pkg)}`;

  try {
    const ok = await Linking.canOpenURL(marketUrl);
    if (ok) {
      await Linking.openURL(marketUrl);
      return true;
    }
  } catch {
    // fall through
  }

  try {
    await Linking.openURL(webUrl);
    return true;
  } catch {
    return false;
  }
}
