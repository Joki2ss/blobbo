import { getJson, setJson } from "../services/storage";

const STORE_KEY = "sxr_support_store_v1";

function defaultStore() {
  return {
    logs: [],
    consentByAdminId: {},
  };
}

export async function loadSupportStore() {
  const s = await getJson(STORE_KEY, null);
  if (!s) return defaultStore();
  return {
    logs: Array.isArray(s.logs) ? s.logs : [],
    consentByAdminId: s.consentByAdminId || {},
  };
}

export async function saveSupportStore(next) {
  await setJson(STORE_KEY, next);
}

export async function appendLog(entry) {
  const s = await loadSupportStore();
  const next = {
    ...s,
    logs: [entry, ...s.logs].slice(0, 2000),
  };
  await saveSupportStore(next);
}

export async function setConsent(adminId, consent) {
  const s = await loadSupportStore();
  const next = {
    ...s,
    consentByAdminId: {
      ...s.consentByAdminId,
      [adminId]: consent,
    },
  };
  await saveSupportStore(next);
}

export async function getConsent(adminId) {
  const s = await loadSupportStore();
  return s.consentByAdminId?.[adminId] || null;
}
