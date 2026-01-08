import { getSupabaseClient } from "./supabaseClient";

function toFeature(row) {
  if (!row) return null;
  return {
    featureId: row.feature_id,
    name: row.name,
    icon: row.icon,
    shortDescription: row.short_description,
    longDescription: row.long_description,
    priceLabel: row.price_label,
    availabilityStatus: row.availability_status,
    enabled: !!row.enabled,
  };
}

export async function cloudAdminListPremiumFeatures() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("admin_list_premium_features");
  if (error) throw new Error(error.message);
  const rows = Array.isArray(data) ? data : [];
  return rows.map(toFeature).filter(Boolean);
}

export async function cloudAdminGetPremiumFeature({ featureId }) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("admin_get_premium_feature", {
    p_feature_id: featureId,
  });
  if (error) throw new Error(error.message);
  return toFeature(data);
}
