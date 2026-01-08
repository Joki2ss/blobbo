import { getJson, setJson } from "./storage";

const KEY = "sxr_update_prompt_v1";

export async function getDismissedLatestVersion() {
  const v = await getJson(KEY, null);
  return v && typeof v === "object" ? v.dismissedLatestVersion || null : null;
}

export async function setDismissedLatestVersion(latestVersion) {
  const s = String(latestVersion || "").trim();
  await setJson(KEY, { dismissedLatestVersion: s || null, updatedAt: Date.now() });
}
