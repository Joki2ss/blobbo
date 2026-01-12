import { getJson, setJson } from "../services/storage";

export const DEV_USER_EMAIL = "neodev29@proton.me";
export const DEV_USER_ID = "u_dev";

const DEV_PASSWORD_KEY = "sxr_mock_dev_password_v1";
const SEED_PASSWORDS_KEY = "sxr_mock_seed_passwords_v1";

function normRole(role) {
  return String(role || "").trim().toUpperCase();
}

function randomPassword() {
  // MOCK only. Not a production mechanism.
  return `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function randomDemoPassword() {
  return `demo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

async function ensurePasswordForEmail(email) {
  const e = String(email || "").trim().toLowerCase();
  if (!e) return "";

  const map = await getJson(SEED_PASSWORDS_KEY, {});
  const next = map && typeof map === "object" ? map : {};
  if (next[e]) return String(next[e]);

  const pwd = randomDemoPassword();
  next[e] = pwd;
  await setJson(SEED_PASSWORDS_KEY, next);
  return pwd;
}

export async function ensureMockDevPassword() {
  const existing = await getJson(DEV_PASSWORD_KEY, "");
  if (existing) return String(existing);

  const pwd = randomPassword();
  await setJson(DEV_PASSWORD_KEY, pwd);
  // Shown only in dev console (MOCK bootstrap).
  // eslint-disable-next-line no-console
  console.log(`[MOCK] Developer password for ${DEV_USER_EMAIL}: ${pwd}`);
  return pwd;
}

export async function ensureSeedDevUser(db) {
  if (!db) return;
  db.users = Array.isArray(db.users) ? db.users : [];

  const now = Date.now();
  let u = db.users.find((x) => x.id === DEV_USER_ID);

  if (!u) {
    u = {
      id: DEV_USER_ID,
      workspaceId: db.workspaces?.[0]?.id || "ws_acme",
      role: "DEVELOPER",
      fullName: "Developer",
      email: DEV_USER_EMAIL,
      phone: "",
      photoUri: "",
      password: "",
      isHiddenFromPublic: true,
      createdAt: now,
      updatedAt: now,
    };
    db.users.unshift(u);
  }

  // Enforce required invariants.
  u.email = DEV_USER_EMAIL;
  u.role = "DEVELOPER";
  u.isHiddenFromPublic = true;
  if (!u.createdAt) u.createdAt = now;
  u.updatedAt = now;

  if (!u.password || normRole(u.role) === "DEVELOPER") {
    u.password = await ensureMockDevPassword();
  }
}

export async function ensureSeedDemoPasswords(db) {
  if (!db) return;
  db.users = Array.isArray(db.users) ? db.users : [];

  for (const u of db.users) {
    if (!u || typeof u !== "object") continue;
    if (normRole(u.role) === "DEVELOPER") continue;
    if (!u.email) continue;
    if (u.password) continue;
    u.password = await ensurePasswordForEmail(u.email);
  }
}
