import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Network from "expo-network";

import { appendLog } from "./SupportStore";
import { sanitizePayload } from "./SupportSanitize";

function createId(prefix = "log") {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function getAppVersion() {
  return (
    (Constants.expoConfig && Constants.expoConfig.version) ||
    (Constants.manifest && Constants.manifest.version) ||
    "unknown"
  );
}

async function deviceSnapshot() {
  let connectionType = null;
  try {
    const netState = await Network.getNetworkStateAsync();
    connectionType = String(netState.type || "unknown");
  } catch {
    connectionType = null;
  }

  return {
    platform: Platform.OS,
    osVersion: String(Platform.Version),
    appVersion: getAppVersion(),
    deviceModel: Device.modelName || "unknown",
    networkSnapshot: {
      connectionType,
    },
  };
}

export async function logSupportEvent({
  category,
  subCategory,
  severity,
  message,
  actorUserId,
  actorRole,
  targetUserId,
  payload,
  tags,
  correlationId,
}) {
  const snap = await deviceSnapshot();
  await appendLog({
    id: createId(),
    timestamp: new Date().toISOString(),
    category,
    subCategory,
    severity,
    message,
    actorUserId,
    actorRole,
    targetUserId,
    tags,
    correlationId,
    payload: sanitizePayload({ ...(payload || {}), deviceSnapshot: snap }),
  });
}
