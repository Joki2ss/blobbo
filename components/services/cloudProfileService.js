import { getSupabaseClient } from "./supabaseClient";

export async function cloudUpdateMyProfile({
  fullName,
  firstName,
  lastName,
  phone,
  photoUri,
  storefrontBusinessName,
  storefrontCategory,
  storefrontVatNumber,
  storefrontStreetAddress,
  storefrontStreetNumber,
  storefrontCity,
  storefrontRegion,
  storefrontCountry,
  storefrontLat,
  storefrontLng,
  storefrontPublicEnabled,
}) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("self_update_profile", {
    p_full_name: fullName || null,
    p_first_name: firstName || null,
    p_last_name: lastName || null,
    p_phone: phone || null,
    p_photo_uri: photoUri || null,
    p_storefront_business_name: storefrontBusinessName || null,
    p_storefront_category: storefrontCategory || null,
    p_storefront_vat_number: storefrontVatNumber || null,
    p_storefront_street_address: storefrontStreetAddress || null,
    p_storefront_street_number: storefrontStreetNumber || null,
    p_storefront_city: storefrontCity || null,
    p_storefront_region: storefrontRegion || null,
    p_storefront_country: storefrontCountry || null,
    p_storefront_lat: storefrontLat != null ? Number(storefrontLat) : null,
    p_storefront_lng: storefrontLng != null ? Number(storefrontLng) : null,
    p_storefront_public_enabled: storefrontPublicEnabled != null ? !!storefrontPublicEnabled : null,
  });

  if (error) throw new Error(error.message);

  // Map DB columns to app shape
  return {
    id: data.user_id,
    fullName: data.full_name || "",
    firstName: data.first_name || "",
    lastName: data.last_name || "",
    phone: data.phone || "",
    photoUri: data.photo_uri || "",
    storefrontBusinessName: data.storefront_business_name || "",
    storefrontCategory: data.storefront_category || "",
    storefrontVatNumber: data.storefront_vat_number || "",
    storefrontStreetAddress: data.storefront_street_address || "",
    storefrontStreetNumber: data.storefront_street_number || "",
    storefrontCity: data.storefront_city || "",
    storefrontRegion: data.storefront_region || "",
    storefrontCountry: data.storefront_country || "",
    storefrontLat: data.storefront_lat,
    storefrontLng: data.storefront_lng,
    storefrontPublicEnabled: !!data.storefront_public_enabled,
  };
}
