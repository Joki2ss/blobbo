import { isAdminOrBusiness } from "../utils/roles";

export function normalizeStorefrontField(value) {
  return String(value || "").trim();
}

export function getStorefrontAddressMissingFields(user) {
  if (!user) return ["user"];
  if (!isAdminOrBusiness(user.role)) return [];

  const streetAddress = normalizeStorefrontField(user.storefrontStreetAddress);
  const streetNumber = normalizeStorefrontField(user.storefrontStreetNumber);
  const city = normalizeStorefrontField(user.storefrontCity);
  const region = normalizeStorefrontField(user.storefrontRegion);
  const country = normalizeStorefrontField(user.storefrontCountry);

  const missing = [];
  if (!streetAddress) missing.push("streetAddress");
  if (!streetNumber) missing.push("streetNumber");
  if (!city) missing.push("city");
  if (!region) missing.push("region");
  if (!country) missing.push("country");
  return missing;
}

export function hasCompleteStorefrontAddress(user) {
  return getStorefrontAddressMissingFields(user).length === 0;
}

export function formatStorefrontAddress(user) {
  if (!user) return "";
  const parts = [
    [user.storefrontStreetAddress, user.storefrontStreetNumber].filter(Boolean).join(" "),
    [user.storefrontCity, user.storefrontRegion].filter(Boolean).join(", "),
    user.storefrontCountry,
  ].filter((x) => String(x || "").trim());
  return parts.join(" • ");
}
