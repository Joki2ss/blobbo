// @ts-nocheck
import { getSupabaseClient } from "./supabaseClient";

function normRole(role: any) {
  return String(role || "").trim().toUpperCase();
}

function toTextArray(value: any): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((x) => String(x || "").trim()).filter(Boolean);
}

export type OnboardingProfilePatch = {
  role?: string;
  primaryCategory?: string;
  enabledModules?: string[];
  dashboardPreset?: string;
};

export async function beginUpgradeToPro({ backendMode, actions, reason }: any): Promise<OnboardingProfilePatch> {
  // Upgrades the *server* role to BUSINESS (CLOUD) and patches local session user.
  // SECURITY: role must never be inferred from UI; this function calls a server RPC in CLOUD.

  if (backendMode === "CLOUD") {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc("self_upgrade_to_business", { p_reason: reason || null });
    if (error) throw new Error(error.message);

    const patch: OnboardingProfilePatch = {
      role: "BUSINESS",
      primaryCategory: data?.primary_category || "",
      enabledModules: toTextArray(data?.enabled_modules),
      dashboardPreset: data?.dashboard_preset || "",
    };

    await actions.patchSessionUser(patch);
    return patch;
  }

  const patch: OnboardingProfilePatch = { role: "BUSINESS" };
  await actions.patchSessionUser(patch);
  return patch;
}

export async function saveProOnboardingResult({ backendMode, actions, result, answers, reason }: any): Promise<OnboardingProfilePatch> {
  if (!result) throw new Error("Missing onboarding result");

  const primaryCategory = String(result.primaryCategory || "").trim();
  const enabledModules = toTextArray(result.enabledModules);
  const dashboardPreset = String(result.dashboardLayoutPreset || result.dashboardPreset || "").trim();

  if (backendMode === "CLOUD") {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc("self_set_pro_onboarding", {
      p_primary_category: primaryCategory,
      p_enabled_modules: enabledModules,
      p_dashboard_preset: dashboardPreset,
      p_answers: answers || null,
      p_reason: reason || null,
    });
    if (error) throw new Error(error.message);

    const patch: OnboardingProfilePatch = {
      role: normRole(data?.role) || "BUSINESS",
      primaryCategory: data?.primary_category || primaryCategory,
      enabledModules: toTextArray(data?.enabled_modules) || enabledModules,
      dashboardPreset: data?.dashboard_preset || dashboardPreset,
    };

    await actions.patchSessionUser(patch);
    return patch;
  }

  const patch: OnboardingProfilePatch = {
    role: "BUSINESS",
    primaryCategory,
    enabledModules,
    dashboardPreset,
  };
  await actions.patchSessionUser(patch);
  return patch;
}
