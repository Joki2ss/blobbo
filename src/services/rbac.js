function normRole(role) {
  return String(role || "").trim().toUpperCase();
}

export function isDeveloper({ user, backendMode, developerUnlocked }) {
  // Security: developer access must never be granted based on email.
  // LIVE must enforce this server-side; client only gates UI.
  // In MOCK, we seed a DEVELOPER user for testing.
  return normRole(user?.role) === "DEVELOPER";
}

export function requireDeveloper({ user, backendMode, developerUnlocked }) {
  if (!isDeveloper({ user, backendMode, developerUnlocked })) {
    const err = new Error("403 Forbidden");
    err.status = 403;
    throw err;
  }
}
