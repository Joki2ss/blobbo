import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";

import { getConsent as getStoredConsent, setConsent as setStoredConsent } from "./SupportStore";
import { logSupportEvent } from "./SupportLogger";

export const CONSENT_VERSION = "1.0";

export function getDefaultConsentText() {
  return [
    "Support consent",
    "",
    "By enabling consent, you allow the developer to view READ-ONLY logs related to your account for debugging/security investigation.",
    "You can revoke consent at any time.",
    "",
    "Scopes:",
    "- Security logs (login/session/security events)",
    "- Technical logs (app errors and API failures)",
    "- Payment logs (future; disabled unless enabled)",
  ].join("\n");
}

function getDeviceSnapshot() {
  const appVersion =
    (Constants.expoConfig && Constants.expoConfig.version) ||
    (Constants.manifest && Constants.manifest.version) ||
    "unknown";

  return {
    platform: Platform.OS,
    osVersion: String(Platform.Version),
    appVersion,
    deviceModel: Device.modelName || "unknown",
  };
}

export async function getConsent(adminId) {
  return getStoredConsent(adminId);
}

export async function setConsent({ adminId, adminEmail, consentGiven, consentScope, consentText }) {
  const record = {
    adminId,
    adminEmail,
    consentGiven,
    timestamp: new Date().toISOString(),
    consentScope,
    consentVersion: CONSENT_VERSION,
    consentText,
    deviceSnapshot: getDeviceSnapshot(),
  };

  await setStoredConsent(adminId, record);

  await logSupportEvent({
    category: "Security",
    subCategory: "SUPPORT_CONSENT_UPDATE",
    severity: "INFO",
    message: consentGiven ? "Support consent granted" : "Support consent revoked",
    actorUserId: adminId,
    actorRole: "ADMIN",
    payload: {
      consentScope,
      consentVersion: CONSENT_VERSION,
    },
  });

  return record;
}

export async function revokeConsent(adminId, adminEmail) {
  return setConsent({
    adminId,
    adminEmail,
    consentGiven: false,
    consentScope: [],
    consentText: getDefaultConsentText(),
  });
}

export async function hasValidConsent(adminId, scope) {
  const c = await getConsent(adminId);
  if (!c?.consentGiven) return false;
  return Array.isArray(c.consentScope) && c.consentScope.includes(scope);
}
