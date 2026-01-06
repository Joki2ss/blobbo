import { isDeveloperUser } from "../support/SupportPermissions";

function normRole(role) {
  return String(role || "").trim().toUpperCase();
}

export function isDeveloper({ user, backendMode, developerUnlocked }) {
  const role = normRole(user?.role);

  // In LIVE/CLOUD we must not rely on email allowlists.
  if (backendMode === "CLOUD") {
    return role === "DEVELOPER";
  }

  if (role === "DEVELOPER") return true;
  return !!developerUnlocked && !!user && isDeveloperUser(user);
}

export function requireDeveloper({ user, backendMode, developerUnlocked }) {
  if (!isDeveloper({ user, backendMode, developerUnlocked })) {
    const err = new Error("403 Forbidden");
    err.status = 403;
    throw err;
  }
}
