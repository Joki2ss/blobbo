// Developer-only helpers.
// SECURITY NOTE: developer access must never be granted by email allowlists or client-side unlock codes.

function normRole(role) {
  return String(role || "").trim().toUpperCase();
}

export function isDeveloperEmail(_email) {
  // Deprecated: email allowlists are not a valid security boundary.
  return false;
}

export function isDeveloperUser(user) {
  return normRole(user?.role) === "DEVELOPER";
}

export function forbiddenError(message = "403 Forbidden") {
  const err = new Error(message);
  err.status = 403;
  return err;
}

export async function verifyDeveloperCode(inputCode) {
  // Deprecated: no client-side unlock codes.
  void inputCode;
  return false;
}

export async function clearDeveloperSession() {
  // No-op; retained for compatibility.
}

export async function setDeveloperSessionVerified() {
  // No-op; retained for compatibility.
}

export async function isDeveloperSessionActive(user) {
  // In this model, dev tools are gated by role claims only.
  return isDeveloperUser(user);
}

export async function requireDeveloperSession(user) {
  if (!isDeveloperUser(user)) throw forbiddenError();
}
