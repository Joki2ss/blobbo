import { loadDb, saveDb } from "./db";
import { createId } from "../../../utils/id";
import { isAdminOrBusiness, isCustomerOrStaff } from "../../../utils/roles";

function sanitizeUser(user) {
  const { password, ...safe } = user;
  return safe;
}

function hasMembership(db, userId, workspaceId) {
  const list = Array.isArray(db.memberships) ? db.memberships : [];
  return list.some((m) => m.userId === userId && m.workspaceId === workspaceId);
}

function assertAuthorizedForWorkspace(db, actor, workspaceId) {
  if (!actor) throw new Error("User not found");
  // Customer/staff are single-workspace in this demo.
  if (isCustomerOrStaff(actor.role) && actor.workspaceId !== workspaceId) {
    throw new Error("Workspace isolation violation");
  }
  // Admin can operate in any workspace they have a membership for (or their original workspace).
  if (isAdminOrBusiness(actor.role)) {
    const ok = actor.workspaceId === workspaceId || hasMembership(db, actor.id, workspaceId);
    if (!ok) throw new Error("Workspace not allowed for this user");
  }
}

function assertTargetInWorkspace(target, workspaceId) {
  if (!target) throw new Error("User not found");
  if (target.workspaceId !== workspaceId) throw new Error("Workspace isolation violation");
}

function pushAudit(db, { workspaceId, actorId, action, targetUserId, before, after }) {
  db.audit = Array.isArray(db.audit) ? db.audit : [];
  db.audit.unshift({
    id: createId("audit"),
    workspaceId,
    actorId,
    action,
    targetUserId,
    before: before || null,
    after: after || null,
    createdAt: Date.now(),
  });
}

function normalizeText(v) {
  return String(v || "").trim();
}

function hasCompleteStorefrontAddress(user) {
  const streetAddress = normalizeText(user.storefrontStreetAddress);
  const streetNumber = normalizeText(user.storefrontStreetNumber);
  const city = normalizeText(user.storefrontCity);
  const region = normalizeText(user.storefrontRegion);
  const country = normalizeText(user.storefrontCountry);
  return !!(streetAddress && streetNumber && city && region && country);
}

function matchesQuery(u, query) {
  const q = normalizeText(query).toLowerCase();
  if (!q) return true;

  const hay = [
    u.fullName,
    u.email,
    u.storefrontBusinessName,
    u.storefrontCategory,
    u.storefrontCity,
    u.storefrontRegion,
    u.storefrontCountry,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return hay.includes(q);
}

export const users = {
  async getById({ workspaceId, userId }) {
    const db = await loadDb();
    const u = db.users.find((x) => x.id === userId && x.workspaceId === workspaceId);
    if (!u) throw new Error("User not found");
    return sanitizeUser(u);
  },

  async getByClientId({ workspaceId, clientId }) {
    const db = await loadDb();
    const u = db.users.find((x) => x.workspaceId === workspaceId && x.clientId === clientId);
    if (!u) return null;
    return sanitizeUser(u);
  },

  // Update profile fields with role-based rules.
  // - CLIENT can update: fullName, phone, photoUri
  // - CLIENT cannot update: email
  // - ADMIN can update client email (admin action)
  async updateProfile({ workspaceId, actorId, targetUserId, updates }) {
    const db = await loadDb();

    const actor = db.users.find((u) => u.id === actorId);
    const target = db.users.find((u) => u.id === targetUserId);
    assertAuthorizedForWorkspace(db, actor, workspaceId);
    assertTargetInWorkspace(target, workspaceId);

    const before = sanitizeUser({ ...target });

    const allowedForSelf = ["fullName", "phone", "photoUri"];
    const allowedForAdminSelfExtra = [
      // Personal details
      "firstName",
      "lastName",
      // Storefront
      "storefrontBusinessName",
      "storefrontCategory",
      "storefrontVatNumber",
      "storefrontStreetAddress",
      "storefrontStreetNumber",
      "storefrontCity",
      "storefrontRegion",
      "storefrontCountry",
      // Optional GPS
      "storefrontLat",
      "storefrontLng",
      // Public toggle
      "storefrontPublicEnabled",
    ];
    const isSelf = actorId === targetUserId;

    if (isSelf) {
      // Self updates
      const role = actor.role;
      if (isCustomerOrStaff(role)) {
        if ("email" in updates) {
          throw new Error("Email changes require admin approval");
        }
        for (const k of allowedForSelf) {
          if (k in updates) target[k] = String(updates[k] || "");
        }
      } else {
        // ADMIN self profile (keep it simple: allow same fields, no email change here)
        if ("email" in updates) {
          throw new Error("Email change is restricted in this demo");
        }
        for (const k of allowedForSelf) {
          if (k in updates) target[k] = String(updates[k] || "");
        }

        for (const k of allowedForAdminSelfExtra) {
          if (!(k in updates)) continue;

          if (k === "storefrontPublicEnabled") {
            target[k] = !!updates[k];
            continue;
          }

          if (k === "storefrontLat" || k === "storefrontLng") {
            const raw = normalizeText(updates[k]);
            target[k] = raw ? Number(raw) : null;
            continue;
          }

          target[k] = String(updates[k] || "");
        }

        // Safety: do not allow enabling public storefront without a complete address.
        if (target.storefrontPublicEnabled && !hasCompleteStorefrontAddress(target)) {
          target.storefrontPublicEnabled = false;
        }
      }

      pushAudit(db, {
        workspaceId,
        actorId,
        action: "user.update_self",
        targetUserId,
        before,
        after: sanitizeUser({ ...target }),
      });

      await saveDb(db);
      return sanitizeUser(target);
    }

    // Admin action on someone else
    if (!isAdminOrBusiness(actor.role)) throw new Error("Forbidden");

    // Only allow admin to change CLIENT email (per requirement)
    if ("email" in updates) {
      if (!isCustomerOrStaff(target.role)) throw new Error("Only customer email can be changed by admin");
      const nextEmail = String(updates.email || "").trim().toLowerCase();
      if (!nextEmail) throw new Error("Email is required");
      const exists = db.users.some((u) => u.id !== target.id && u.email.toLowerCase() === nextEmail);
      if (exists) throw new Error("Email already in use");
      target.email = nextEmail;
    }

    // Admin can also update basic profile fields for the client
    for (const k of allowedForSelf) {
      if (k in updates) target[k] = String(updates[k] || "");
    }

    pushAudit(db, {
      workspaceId,
      actorId,
      action: "user.admin_update",
      targetUserId,
      before,
      after: sanitizeUser({ ...target }),
    });

    await saveDb(db);
    return sanitizeUser(target);
  },

  // Public directory (for the map/search screen).
  async listPublicStorefronts({ query }) {
    const db = await loadDb();
    const list = db.users
      .filter((u) => isAdminOrBusiness(u.role))
      .filter((u) => !!u.storefrontPublicEnabled)
      .filter((u) => hasCompleteStorefrontAddress(u))
      .filter((u) => matchesQuery(u, query))
      .map((u) => sanitizeUser(u));

    // Basic deterministic order
    return list.sort((a, b) => String(a.storefrontBusinessName || a.fullName || "").localeCompare(String(b.storefrontBusinessName || b.fullName || "")));
  },

  async getPublicStorefrontById({ userId }) {
    const db = await loadDb();
    const u = db.users.find((x) => x.id === userId);
    if (!u) throw new Error("User not found");
    if (!isAdminOrBusiness(u.role)) throw new Error("Not a storefront");
    if (!u.storefrontPublicEnabled) throw new Error("Storefront not public");
    if (!hasCompleteStorefrontAddress(u)) throw new Error("Storefront address incomplete");
    return sanitizeUser(u);
  },
};
