import { loadDb, saveDb } from "./db";
import { createId } from "../../../utils/id";

function sanitizeUser(user) {
  const { password, ...safe } = user;
  return safe;
}

export const auth = {
  async login({ email, password }) {
    const db = await loadDb();
    const user = db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
    if (!user || user.password !== password) {
      throw new Error("Invalid email or password");
    }
    return sanitizeUser(user);
  },

  async register({ workspaceId, role, fullName, email, phone, password }) {
    const db = await loadDb();
    const exists = db.users.some((u) => u.email.toLowerCase() === String(email).toLowerCase());
    if (exists) throw new Error("Email already registered");

    const user = {
      id: createId("u"),
      workspaceId,
      role,
      fullName,
      email,
      phone: phone || "",
      password,
    };

    db.users.unshift(user);

    db.memberships = Array.isArray(db.memberships) ? db.memberships : [];
    db.memberships.unshift({ userId: user.id, workspaceId: user.workspaceId });

    await saveDb(db);
    return sanitizeUser(user);
  },

  async forgotPassword({ email }) {
    // Mock flow: always succeed (do not reveal whether email exists)
    return { ok: true, message: `If an account exists for ${email}, you will receive an email shortly.` };
  },
};
