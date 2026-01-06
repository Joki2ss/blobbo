function asText(v) {
  return String(v || "").trim();
}

function asList(v) {
  if (Array.isArray(v)) return v.map((x) => asText(x)).filter(Boolean);
  if (typeof v === "string") {
    return v
      .split(",")
      .map((x) => asText(x))
      .filter(Boolean);
  }
  return [];
}

function normalizeProfile(u) {
  if (!u) return null;
  return {
    id: String(u.userId || u.id || ""),
    businessName: asText(u.storefrontBusinessName) || asText(u.fullName),
    ownerName: [asText(u.firstName), asText(u.lastName)].filter(Boolean).join(" ") || asText(u.fullName),
    category: asText(u.storefrontCategory),
    city: asText(u.storefrontCity),
    region: asText(u.storefrontRegion),
    country: asText(u.storefrontCountry),
    tags: asList(u.storefrontTags),
    services: asList(u.storefrontServices),
    lat: typeof u.storefrontLat === "number" ? u.storefrontLat : Number(u.storefrontLat),
    lng: typeof u.storefrontLng === "number" ? u.storefrontLng : Number(u.storefrontLng),
    raw: u,
  };
}

export async function searchPublicProfiles({ backendUsers, query, limit = 10 }) {
  const q = asText(query);
  const res = await backendUsers.searchPublicProfiles({ q, limit });
  const list = Array.isArray(res) ? res : [];
  return list.map(normalizeProfile).filter(Boolean);
}

export async function nearbyPublicProfiles({ backendUsers, lat, lng, radiusKm = 25, limit = 25 }) {
  const res = await backendUsers.nearPublicProfiles({ lat, lng, radiusKm, limit });
  const list = Array.isArray(res) ? res : [];
  return list.map(normalizeProfile).filter(Boolean);
}

export async function getPublicProfileById({ backendUsers, userId }) {
  const res = await backendUsers.getPublicProfileById({ userId });
  return normalizeProfile(res);
}
