import Constants from "expo-constants";

import { getSupabaseClient } from "./supabaseClient";

export function getAppVersion() {
  // Expo config version is the app.json version.
  const v =
    (Constants.expoConfig && Constants.expoConfig.version) ||
    (Constants.manifest && Constants.manifest.version) ||
    null;
  return v ? String(v).trim() : null;
}

export async function cloudGetAppUpdateConfig() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("get_app_update_config");
  if (error) throw new Error(error.message);

  // Supabase RPC returning TABLE comes back as an object or array depending on settings;
  // normalize to a plain object.
  const row = Array.isArray(data) ? data[0] : data;
  return {
    latestVersion: row?.latest_version ? String(row.latest_version) : null,
    minVersion: row?.min_version ? String(row.min_version) : null,
    updateEnabled: !!row?.update_enabled,
    forceUpdate: !!row?.force_update,
  };
}
