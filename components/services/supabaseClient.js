import { createClient } from "@supabase/supabase-js";

let singleton = null;

function readEnv(name) {
  const v = typeof process !== "undefined" ? process.env?.[name] : null;
  return v && String(v).trim() ? String(v).trim() : null;
}

export function getSupabaseConfig() {
  // Support both Node (.env) and Expo public env vars.
  const url = readEnv("EXPO_PUBLIC_SUPABASE_URL") || readEnv("SUPABASE_URL");
  const anonKey = readEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY") || readEnv("SUPABASE_ANON_KEY");
  return { url, anonKey };
}

export function getSupabaseClient() {
  if (singleton) return singleton;

  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    const err = new Error(
      "Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY (Expo) or SUPABASE_URL + SUPABASE_ANON_KEY (Node)."
    );
    err.code = "SUPABASE_NOT_CONFIGURED";
    throw err;
  }

  singleton = createClient(url, anonKey, {
    auth: {
      // Let the app decide persistence; default is fine.
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });

  return singleton;
}
