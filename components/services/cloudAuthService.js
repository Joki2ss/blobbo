import { getSupabaseClient } from "./supabaseClient";

function normRole(role) {
  const r = String(role || "").trim().toUpperCase() || "USER";
  // Supabase DB uses USER for standard accounts; the app UX calls this CUSTOMER.
  if (r === "USER") return "CUSTOMER";
  if (r === "CLIENT") return "CUSTOMER";
  return r;
}

async function fetchMyProfileRole(supabase) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", (await supabase.auth.getUser()).data?.user?.id)
    .maybeSingle();

  if (error) {
    // If RLS blocks or profile row missing, fall back to USER.
    return "USER";
  }
  return {
    role: normRole(data?.role),
    primaryCategory: data?.primary_category || "",
    enabledModules: Array.isArray(data?.enabled_modules) ? data.enabled_modules : [],
    dashboardPreset: data?.dashboard_preset || "",
  };
}

function toAppUser({ authUser, role }) {
  return {
    id: authUser.id,
    email: authUser.email || "",
    role: normRole(role?.role || role),

    // App expects a workspaceId; in CLOUD-only mode we use a single placeholder.
    workspaceId: "ws_cloud",

    // Keep shape compatible with existing UI; optional fields.
    fullName: role?.full_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || "",
    firstName: role?.first_name || "",
    lastName: role?.last_name || "",
    phone: role?.phone || "",
    photoUri: role?.photo_uri || "",

    primaryCategory: role?.primaryCategory || "",
    enabledModules: Array.isArray(role?.enabledModules) ? role.enabledModules : [],
    dashboardPreset: role?.dashboardPreset || "",

    storefrontBusinessName: role?.storefront_business_name || "",
    storefrontCategory: role?.storefront_category || "",
    storefrontVatNumber: role?.storefront_vat_number || "",
    storefrontStreetAddress: role?.storefront_street_address || "",
    storefrontStreetNumber: role?.storefront_street_number || "",
    storefrontCity: role?.storefront_city || "",
    storefrontRegion: role?.storefront_region || "",
    storefrontCountry: role?.storefront_country || "",
    storefrontLat: role?.storefront_lat,
    storefrontLng: role?.storefront_lng,
    storefrontPublicEnabled: !!role?.storefront_public_enabled,
  };
}

export async function cloudLogin({ email, password }) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: String(email || "").trim(),
    password: String(password || ""),
  });
  if (error) throw new Error(error.message);
  const authUser = data?.user;
  if (!authUser?.id) throw new Error("Login failed");

  const role = await fetchMyProfileRole(supabase);
  return toAppUser({ authUser, role });
}

export async function cloudRegister({ email, password, fullName }) {
  const supabase = getSupabaseClient();
  const e = String(email || "").trim();
  const p = String(password || "");
  const ph = String(arguments?.[0]?.phone || "").trim();
  const fn = String(arguments?.[0]?.firstName || "").trim();
  const ln = String(arguments?.[0]?.lastName || "").trim();
  const derivedFullName = String(fullName || "" || "").trim() || [fn, ln].filter(Boolean).join(" ");

  if (!p) throw new Error("Password is required");
  if (!e && !ph) throw new Error("Email or phone is required");

  const signUpPayload = e
    ? {
        email: e,
        password: p,
        options: {
          data: {
            full_name: derivedFullName,
            first_name: fn,
            last_name: ln,
            phone: ph,
          },
        },
      }
    : {
        phone: ph,
        password: p,
        options: {
          data: {
            full_name: derivedFullName,
            first_name: fn,
            last_name: ln,
          },
        },
      };

  const { data, error } = await supabase.auth.signUp(signUpPayload);
  if (error) throw new Error(error.message);

  const authUser = data?.user;
  if (!authUser?.id) {
    // If email confirmation is enabled, user might be null.
    // Keep a predictable error for the app.
    throw new Error("Registration created. Check email to confirm sign-in.");
  }

  // Best-effort: persist profile fields into public.profiles (if the RPC exists and we have a session).
  // If email confirmation is required, authUser may be null; in that case we throw below as before.
  try {
    if (authUser?.id) {
      await supabase.rpc("self_update_profile", {
        p_full_name: derivedFullName || null,
        p_first_name: fn || null,
        p_last_name: ln || null,
        p_phone: ph || null,
      });
    }
  } catch (_) {
    // Ignore: keep registration flow resilient even if the migration is not applied.
  }

  const role = await fetchMyProfileRole(supabase);
  return toAppUser({ authUser, role });
}

export async function cloudForgotPassword({ email }) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(String(email || "").trim());
  if (error) throw new Error(error.message);
  return { ok: true };
}
