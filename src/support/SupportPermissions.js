import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";

import { DEV_CODE_HASH_SHA256, DEV_EMAIL_ALLOWLIST, DEV_SESSION_TTL_MS } from "../config/dev";

const DEV_SESSION_KEY = "sxr_dev_session_v1";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function isDeveloperEmail(email) {
  const e = normalizeEmail(email);
  return DEV_EMAIL_ALLOWLIST.map((x) => normalizeEmail(x)).includes(e);
}

export function isDeveloperUser(user) {
  return !!user?.email && isDeveloperEmail(user.email);
}

export function forbiddenError(message = "403 Forbidden") {
  const err = new Error(message);
  err.status = 403;
  return err;
}

export async function verifyDeveloperCode(inputCode) {
  const code = String(inputCode || "").trim();
  if (!code) return false;

  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, code, {
    encoding: Crypto.CryptoEncoding.HEX,
  });

  return digest === DEV_CODE_HASH_SHA256;
}

async function getDevSession() {
  try {
    const raw = await SecureStore.getItemAsync(DEV_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function clearDeveloperSession() {
  try {
    await SecureStore.deleteItemAsync(DEV_SESSION_KEY);
  } catch {
    // ignore
  }
}

export async function setDeveloperSessionVerified() {
  const session = { verifiedAt: Date.now() };
  await SecureStore.setItemAsync(DEV_SESSION_KEY, JSON.stringify(session));
}

export async function isDeveloperSessionActive(user) {
  if (!isDeveloperUser(user)) return false;
  const s = await getDevSession();
  if (!s?.verifiedAt) return false;
  const age = Date.now() - Number(s.verifiedAt);
  return age >= 0 && age <= DEV_SESSION_TTL_MS;
}

export async function requireDeveloperSession(user) {
  const ok = await isDeveloperSessionActive(user);
  if (!ok) throw forbiddenError();
}
