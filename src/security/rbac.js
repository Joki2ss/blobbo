// Client-side RBAC helpers.
// IMPORTANT: must be enforced server-side in LIVE/CLOUD.

function normRole(role) {
  return String(role || "").trim().toUpperCase();
}

export function isDeveloperRole(user) {
  return normRole(user?.role) === "DEVELOPER";
}

export function isAdminRole(user) {
  return normRole(user?.role) === "ADMIN";
}

export function isBusinessRole(user) {
  return normRole(user?.role) === "BUSINESS";
}
