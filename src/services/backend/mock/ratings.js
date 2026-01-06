import * as Crypto from "expo-crypto";

import { loadDb, saveDb } from "./db";
import { createId } from "../../../utils/id";
import { isAdminOrBusiness } from "../../../utils/roles";

const RATING_RETENTION_DAYS = 90;
const ONE_RATING_WINDOW_DAYS = 7;

function nowMs() {
  return Date.now();
}

function clampRating(v) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return null;
  if (n < 1 || n > 5) return null;
  return n;
}

function normalizeAnswers(answers) {
  const src = answers && typeof answers === "object" ? answers : {};
  const out = {};
  for (const k of Object.keys(src)) {
    const key = String(k || "").trim();
    if (!key) continue;
    const v = src[k];
    if (typeof v !== "string") continue;
    const text = v.trim().slice(0, 140);
    if (!text) continue;
    out[key] = text;
  }
  return out;
}

async function computeRaterHash(userId) {
  const raw = String(userId || "");
  if (!raw) return "";
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw, {
    encoding: Crypto.CryptoEncoding.HEX,
  });
}

function pruneEvents(db) {
  const cutoff = nowMs() - RATING_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  db.ratingEvents = Array.isArray(db.ratingEvents) ? db.ratingEvents : [];
  const keep = db.ratingEvents.filter((e) => (e.createdAt || 0) >= cutoff);
  if (keep.length !== db.ratingEvents.length) {
    db.ratingEvents = keep;
    return true;
  }
  return false;
}

function rebuildAggregate(db, businessId) {
  db.ratingAggregates = Array.isArray(db.ratingAggregates) ? db.ratingAggregates : [];
  db.ratingEvents = Array.isArray(db.ratingEvents) ? db.ratingEvents : [];

  const events = db.ratingEvents.filter((e) => e.businessId === businessId && !e.isDeleted);
  const hist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const e of events) {
    const r = Number(e.ratingValue);
    if (!Number.isFinite(r) || r < 1 || r > 5) continue;
    hist[r] = (hist[r] || 0) + 1;
    sum += r;
  }
  const count = events.length;
  const avg = count ? Math.round((sum / count) * 100) / 100 : 0;

  const idx = db.ratingAggregates.findIndex((a) => a.businessId === businessId);
  const next = {
    businessId,
    avgRating: avg,
    countTotal: count,
    histogram: hist,
    lastUpdatedAt: nowMs(),
  };
  if (idx >= 0) db.ratingAggregates[idx] = next;
  else db.ratingAggregates.unshift(next);

  return next;
}

function assertBusinessExists(db, businessId) {
  const u = db.users.find((x) => x.id === businessId);
  if (!u) throw new Error("Business not found");
  if (!isAdminOrBusiness(u.role)) throw new Error("Not a business profile");
}

export const ratings = {
  async getAggregate({ businessId }) {
    const db = await loadDb();
    pruneEvents(db);

    db.ratingAggregates = Array.isArray(db.ratingAggregates) ? db.ratingAggregates : [];
    const a = db.ratingAggregates.find((x) => x.businessId === businessId);
    if (a) return a;

    // If missing, build an empty aggregate.
    assertBusinessExists(db, businessId);
    const next = rebuildAggregate(db, businessId);
    await saveDb(db);
    return next;
  },

  async submitRating({ actorId, businessId, ratingValue, answers }) {
    const db = await loadDb();

    if (!actorId) throw new Error("Not signed in");
    assertBusinessExists(db, businessId);

    db.ratingEvents = Array.isArray(db.ratingEvents) ? db.ratingEvents : [];

    const r = clampRating(ratingValue);
    if (!r) throw new Error("Invalid rating value");

    // One rating per business per window.
    const windowMs = ONE_RATING_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const latest = db.ratingEvents
      .filter((e) => e.businessId === businessId && e.raterUserId === actorId && !e.isDeleted)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0];

    if (latest && nowMs() - (latest.createdAt || 0) < windowMs) {
      throw new Error(`You can rate this profile once every ${ONE_RATING_WINDOW_DAYS} days.`);
    }

    const event = {
      id: createId("rate"),
      businessId,
      raterUserId: actorId,
      raterHash: await computeRaterHash(actorId),
      ratingValue: r,
      answers: normalizeAnswers(answers),
      createdAt: nowMs(),
      ip: null,
      userAgent: null,
      isDeleted: false,
    };

    db.ratingEvents.unshift(event);

    pruneEvents(db);
    const agg = rebuildAggregate(db, businessId);

    await saveDb(db);
    return { ok: true, aggregate: agg };
  },

  async exportMyRatings({ actorId }) {
    const db = await loadDb();
    if (!actorId) throw new Error("Not signed in");

    db.ratingEvents = Array.isArray(db.ratingEvents) ? db.ratingEvents : [];
    const list = db.ratingEvents
      .filter((e) => e.raterUserId === actorId && !e.isDeleted)
      .map((e) => ({
        id: e.id,
        businessId: e.businessId,
        ratingValue: e.ratingValue,
        answers: e.answers || {},
        createdAt: e.createdAt,
      }));

    return { userId: actorId, ratings: list };
  },

  async deleteMyRatings({ actorId }) {
    const db = await loadDb();
    if (!actorId) throw new Error("Not signed in");

    db.ratingEvents = Array.isArray(db.ratingEvents) ? db.ratingEvents : [];
    const touched = new Set();

    for (const e of db.ratingEvents) {
      if (e.raterUserId === actorId && !e.isDeleted) {
        e.isDeleted = true;
        touched.add(e.businessId);
      }
    }

    for (const businessId of touched) rebuildAggregate(db, businessId);

    await saveDb(db);
    return { ok: true };
  },

  // Dev-only helpers (caller must enforce RBAC outside in LIVE)
  async listEventsForBusiness({ businessId, limit = 200 }) {
    const db = await loadDb();
    pruneEvents(db);

    db.ratingEvents = Array.isArray(db.ratingEvents) ? db.ratingEvents : [];
    return db.ratingEvents
      .filter((e) => e.businessId === businessId)
      .slice(0, Math.max(1, Math.min(500, Number(limit) || 200)))
      .map((e) => ({
        id: e.id,
        businessId: e.businessId,
        raterHash: e.raterHash,
        ratingValue: e.ratingValue,
        answers: e.answers || {},
        createdAt: e.createdAt,
        isDeleted: !!e.isDeleted,
      }));
  },

  async deleteEvent({ eventId }) {
    const db = await loadDb();
    db.ratingEvents = Array.isArray(db.ratingEvents) ? db.ratingEvents : [];
    const e = db.ratingEvents.find((x) => x.id === eventId);
    if (!e) throw new Error("Not found");
    e.isDeleted = true;
    const agg = rebuildAggregate(db, e.businessId);
    await saveDb(db);
    return { ok: true, aggregate: agg };
  },
};
