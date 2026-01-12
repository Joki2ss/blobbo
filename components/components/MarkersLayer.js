function safeJson(obj) {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

export function buildSetMarkersScript(markers) {
  const payload = Array.isArray(markers) ? markers : [];
  return `window.setMarkers && window.setMarkers(${safeJson(payload)}); true;`;
}

export function buildSetCenterScript(center) {
  if (!center || typeof center.lat !== "number" || typeof center.lng !== "number") return "true;";
  return `window.setCenter && window.setCenter(${safeJson(center)}); true;`;
}
