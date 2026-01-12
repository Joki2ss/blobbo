import { getSupportRuntimeConfig } from "../config/supportFlags";
import { loadSupportStore } from "./SupportStore";
import { requireDeveloperSession } from "./SupportPermissions";
import { hasValidConsent } from "./SupportConsent";
import { scopeForCategory } from "./SupportCategories";

export async function listAllLogs({ backendMode, sessionUser }) {
  const cfg = getSupportRuntimeConfig({ backendMode });
  if (!cfg.SUPPORT_ENABLED || !cfg.DEVELOPER_MODE) throw new Error("Support is disabled");
  await requireDeveloperSession(sessionUser);
  const store = await loadSupportStore();
  return store.logs;
}

export async function listLogsByUser({ backendMode, sessionUser, userId }) {
  const cfg = getSupportRuntimeConfig({ backendMode });
  if (!cfg.SUPPORT_ENABLED || !cfg.DEVELOPER_MODE) throw new Error("Support is disabled");
  await requireDeveloperSession(sessionUser);

  const store = await loadSupportStore();
  const subset = store.logs.filter((l) => l.actorUserId === userId || l.targetUserId === userId);

  const filtered = [];
  for (const l of subset) {
    const scope = scopeForCategory(l.category);
    const ok = await hasValidConsent(userId, scope);
    if (ok) filtered.push(l);
  }

  return filtered;
}
