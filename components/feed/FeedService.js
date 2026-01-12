import { createId } from "../utils/id";
import { PLAN_DEFAULTS, PLAN_LIMITS, PLAN_PRIORITY, PLAN_TYPES, VISIBILITY_STATUS } from "./FeedPlans";
import { loadPosts, savePosts } from "./FeedStore";
import { plainTextForSearch, sanitizeRichTextHtml } from "./FeedSanitize";

function nowMs() {
  return Date.now();
}

function startOfMonth(ms) {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

function startOfWeek(ms) {
  // ISO-ish: Monday as start.
  const d = new Date(ms);
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function computeInitialRankingScore({ planType, createdAt }) {
  const base = (PLAN_PRIORITY[planType] || 0) * 100;
  // Mild recency boost at creation time.
  const ageH = Math.max(0, (nowMs() - createdAt) / (1000 * 60 * 60));
  const recency = Math.max(0, 50 - ageH);
  return Math.round(base + recency);
}

function normalizeKeywords(list) {
  const src = Array.isArray(list) ? list : [];
  const out = [];
  const seen = new Set();
  for (const k of src) {
    const s = String(k || "").trim().toLowerCase();
    if (!s) continue;
    if (s.length > 24) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
    if (out.length >= 10) break;
  }
  return out;
}

function normalizeImages(list) {
  const src = Array.isArray(list) ? list : [];
  return src.slice(0, PLAN_LIMITS.MAX_IMAGES_PER_POST).filter((x) => x && typeof x.uri === "string");
}

function computeVisibilityStatus(post, now) {
  if (!post) return VISIBILITY_STATUS.PAUSED;
  if (post.visibilityStatus === VISIBILITY_STATUS.DELETED) return VISIBILITY_STATUS.DELETED;
  if (post.visibilityStatus === VISIBILITY_STATUS.PAUSED) return VISIBILITY_STATUS.PAUSED;
  if (post.expiresAt && now > post.expiresAt) return VISIBILITY_STATUS.EXPIRED;
  return VISIBILITY_STATUS.ACTIVE;
}

function normalizeModerationTags(list) {
  const src = Array.isArray(list) ? list : [];
  const out = [];
  const seen = new Set();
  for (const t of src) {
    const s = String(t || "").trim();
    if (!s) continue;
    if (s.length > 28) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
    if (out.length >= 12) break;
  }
  return out;
}

function enforceOwnerQuotas({ posts, ownerUserId, planType, now }) {
  const mine = posts.filter((p) => p.ownerUserId === ownerUserId);

  if (planType === PLAN_TYPES.ENTRY) {
    const countPermanent = mine.filter((p) => p.isPermanent && computeVisibilityStatus(p, now) !== VISIBILITY_STATUS.EXPIRED).length;
    if (countPermanent >= PLAN_LIMITS.ENTRY_MAX_PERMANENT_POSTS) {
      return { ok: false, reason: "ENTRY plan allows only 1 permanent post." };
    }
  }

  if (planType === PLAN_TYPES.BASIC) {
    const since = startOfMonth(now);
    const count = mine.filter((p) => (p.createdAt || 0) >= since && p.planType === PLAN_TYPES.BASIC).length;
    if (count >= PLAN_LIMITS.BASIC_MAX_POSTS_PER_MONTH) {
      return { ok: false, reason: "BASIC plan quota exceeded (2 posts per month)." };
    }
  }

  if (planType === PLAN_TYPES.PRO) {
    const since = startOfWeek(now);
    const count = mine.filter((p) => (p.createdAt || 0) >= since && p.planType === PLAN_TYPES.PRO).length;
    if (count >= PLAN_LIMITS.PRO_MAX_POSTS_PER_WEEK) {
      return { ok: false, reason: "PRO plan quota exceeded (2 posts per week)." };
    }
  }

  return { ok: true };
}

function enforceWelcomeQuota({ posts }) {
  const count = posts.filter((p) => p.planType === PLAN_TYPES.WELCOME).length;
  if (count >= PLAN_LIMITS.WELCOME_MAX_TOTAL_POSTS) {
    return { ok: false, reason: "WELCOME pack quota exceeded (3 total posts)." };
  }
  return { ok: true };
}

function searchableBlob(post) {
  const parts = [
    post.title,
    plainTextForSearch(post.description),
    Array.isArray(post.keywords) ? post.keywords.join(" ") : "",
    post.ownerCategory,
    post.ownerBusinessName,
    post.location?.city,
    post.location?.region,
  ];
  return parts
    .filter(Boolean)
    .map((s) => String(s).toLowerCase())
    .join(" \n ");
}

export async function listFeedPosts({ includeAllForDeveloper = false } = {}) {
  const posts = await loadPosts();
  const now = nowMs();

  // Auto-expire.
  let changed = false;
  for (const p of posts) {
    const next = computeVisibilityStatus(p, now);
    if (p.visibilityStatus !== next) {
      p.visibilityStatus = next;
      changed = true;
    }
  }
  if (changed) await savePosts(posts);

  const visible = includeAllForDeveloper
    ? posts
    : posts.filter((p) => computeVisibilityStatus(p, now) === VISIBILITY_STATUS.ACTIVE);

  return visible.sort((a, b) => {
    // pinned first (ascending pinnedRank)
    const ap = Number.isFinite(Number(a.pinnedRank)) ? Number(a.pinnedRank) : null;
    const bp = Number.isFinite(Number(b.pinnedRank)) ? Number(b.pinnedRank) : null;
    const aPinned = ap !== null;
    const bPinned = bp !== null;
    if (aPinned !== bPinned) return aPinned ? -1 : 1;
    if (aPinned && bPinned && ap !== bp) return ap - bp;

    // plan priority desc, rankingScore desc, recency desc
    const pa = PLAN_PRIORITY[a.planType] || 0;
    const pb = PLAN_PRIORITY[b.planType] || 0;
    if (pb !== pa) return pb - pa;
    const ra = Number(a.rankingScore || 0);
    const rb = Number(b.rankingScore || 0);
    if (rb !== ra) return rb - ra;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
}

export async function searchFeedPosts({ query, includeAllForDeveloper = false } = {}) {
  const q = String(query || "").trim().toLowerCase();
  const list = await listFeedPosts({ includeAllForDeveloper });
  if (!q) return list;

  const filtered = list.filter((p) => searchableBlob(p).includes(q));
  // same sort already applied, keep.
  return filtered;
}

export async function createFeedPost({
  actor,
  asOwnerUserId,
  post,
  allowDeveloperOverride = false,
}) {
  const posts = await loadPosts();
  const now = nowMs();

  const ownerUserId = asOwnerUserId || actor?.id;
  if (!ownerUserId) return { ok: false, reason: "Missing ownerUserId" };

  const planType = post?.planType;
  if (!planType || !Object.values(PLAN_TYPES).includes(planType)) {
    return { ok: false, reason: "Invalid planType" };
  }

  if (planType === PLAN_TYPES.WELCOME) {
    if (!allowDeveloperOverride) return { ok: false, reason: "WELCOME pack is developer-controlled" };
    const w = enforceWelcomeQuota({ posts });
    if (!w.ok) return w;
  } else {
    const q = enforceOwnerQuotas({ posts, ownerUserId, planType, now });
    if (!q.ok) return q;
  }

  const createdAt = now;
  const isPermanent = !!post?.isPermanent;

  let expiresAt = post?.expiresAt || null;
  if (planType === PLAN_TYPES.BASIC) {
    expiresAt = createdAt + PLAN_DEFAULTS.BASIC_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  }

  const entity = {
    postId: createId("fp"),
    ownerUserId,
    ownerBusinessName: String(post?.ownerBusinessName || "").trim().slice(0, 60),
    ownerCategory: String(post?.ownerCategory || "").trim().slice(0, 40),
    title: String(post?.title || "").trim().slice(0, 70),
    description: sanitizeRichTextHtml(String(post?.description || "")),
    keywords: normalizeKeywords(post?.keywords),
    images: normalizeImages(post?.images),
    createdAt,
    expiresAt,
    isPermanent: planType === PLAN_TYPES.WELCOME ? true : isPermanent,
    planType,
    visibilityStatus: VISIBILITY_STATUS.ACTIVE,
    rankingScore: Number.isFinite(Number(post?.rankingScore)) ? Number(post.rankingScore) : computeInitialRankingScore({ planType, createdAt }),
    pinnedRank: Number.isFinite(Number(post?.pinnedRank)) ? Number(post.pinnedRank) : null,
    moderationTags: normalizeModerationTags(post?.moderationTags),
    lastModeratedByUserId: "",
    lastModeratedAt: null,
    authorRole: typeof post?.authorRole === "string" ? String(post.authorRole).trim().toUpperCase() : (actor?.role ? String(actor.role).trim().toUpperCase() : ""),
    location: post?.location && (post.location.city || post.location.region)
      ? {
          city: post.location.city ? String(post.location.city).slice(0, 50) : "",
          region: post.location.region ? String(post.location.region).slice(0, 50) : "",
        }
      : null,
  };

  if (!entity.title) return { ok: false, reason: "Title is required" };
  if (!entity.ownerBusinessName) return { ok: false, reason: "Business name is required" };
  if (!entity.ownerCategory) return { ok: false, reason: "Category is required" };

  posts.unshift(entity);
  await savePosts(posts);
  return { ok: true, post: entity };
}

export async function getPlanQuotaInfo({ ownerUserId, planType }) {
  const posts = await loadPosts();
  const now = nowMs();

  if (!ownerUserId) return { remaining: null, window: null, limit: null };

  if (planType === PLAN_TYPES.ENTRY) {
    const mine = posts.filter((p) => p.ownerUserId === ownerUserId);
    const used = mine.filter((p) => p.isPermanent && computeVisibilityStatus(p, now) !== VISIBILITY_STATUS.EXPIRED).length;
    const limit = PLAN_LIMITS.ENTRY_MAX_PERMANENT_POSTS;
    return { remaining: Math.max(0, limit - used), window: "PERMANENT", limit };
  }

  if (planType === PLAN_TYPES.BASIC) {
    const mine = posts.filter((p) => p.ownerUserId === ownerUserId);
    const since = startOfMonth(now);
    const used = mine.filter((p) => (p.createdAt || 0) >= since && p.planType === PLAN_TYPES.BASIC).length;
    const limit = PLAN_LIMITS.BASIC_MAX_POSTS_PER_MONTH;
    return { remaining: Math.max(0, limit - used), window: "MONTH", limit };
  }

  if (planType === PLAN_TYPES.PRO) {
    const mine = posts.filter((p) => p.ownerUserId === ownerUserId);
    const since = startOfWeek(now);
    const used = mine.filter((p) => (p.createdAt || 0) >= since && p.planType === PLAN_TYPES.PRO).length;
    const limit = PLAN_LIMITS.PRO_MAX_POSTS_PER_WEEK;
    return { remaining: Math.max(0, limit - used), window: "WEEK", limit };
  }

  if (planType === PLAN_TYPES.WELCOME) {
    const used = posts.filter((p) => p.planType === PLAN_TYPES.WELCOME).length;
    const limit = PLAN_LIMITS.WELCOME_MAX_TOTAL_POSTS;
    return { remaining: Math.max(0, limit - used), window: "GLOBAL", limit };
  }

  return { remaining: null, window: null, limit: null };
}

export async function updateFeedPost({ actor, postId, patch, allowDeveloperOverride = false }) {
  const posts = await loadPosts();
  const idx = posts.findIndex((p) => p.postId === postId);
  if (idx < 0) return { ok: false, reason: "Not found" };

  const existing = posts[idx];
  const isOwner = actor?.id && existing.ownerUserId === actor.id;
  if (!isOwner && !allowDeveloperOverride) return { ok: false, reason: "Not allowed" };

  const next = { ...existing };

  if (typeof patch?.title === "string") next.title = String(patch.title).trim().slice(0, 70);
  if (typeof patch?.description === "string") next.description = sanitizeRichTextHtml(String(patch.description));
  if (Array.isArray(patch?.keywords)) next.keywords = normalizeKeywords(patch.keywords);
  if (Array.isArray(patch?.images)) next.images = normalizeImages(patch.images);
  if (patch?.location) {
    next.location = (patch.location.city || patch.location.region)
      ? {
          city: patch.location.city ? String(patch.location.city).slice(0, 50) : "",
          region: patch.location.region ? String(patch.location.region).slice(0, 50) : "",
        }
      : null;
  }

  if (allowDeveloperOverride) {
    if (typeof patch?.rankingScore !== "undefined") next.rankingScore = Number(patch.rankingScore) || 0;
    if (typeof patch?.planType === "string" && Object.values(PLAN_TYPES).includes(patch.planType)) next.planType = patch.planType;
    if (typeof patch?.visibilityStatus === "string" && Object.values(VISIBILITY_STATUS).includes(patch.visibilityStatus)) {
      next.visibilityStatus = patch.visibilityStatus;
    }
    if (typeof patch?.expiresAt !== "undefined") next.expiresAt = patch.expiresAt ? Number(patch.expiresAt) : null;
    if (typeof patch?.isPermanent !== "undefined") next.isPermanent = !!patch.isPermanent;
    if (typeof patch?.ownerBusinessName === "string") next.ownerBusinessName = String(patch.ownerBusinessName).trim().slice(0, 60);
    if (typeof patch?.ownerCategory === "string") next.ownerCategory = String(patch.ownerCategory).trim().slice(0, 40);
    if (typeof patch?.ownerUserId === "string") next.ownerUserId = String(patch.ownerUserId);

    if ("pinnedRank" in (patch || {})) {
      const r = patch.pinnedRank === null || patch.pinnedRank === "" ? null : Number(patch.pinnedRank);
      next.pinnedRank = Number.isFinite(r) ? r : null;
    }
    if (Array.isArray(patch?.moderationTags)) next.moderationTags = normalizeModerationTags(patch.moderationTags);
    if (typeof patch?.lastModeratedByUserId === "string") next.lastModeratedByUserId = String(patch.lastModeratedByUserId);
    if (typeof patch?.lastModeratedAt !== "undefined") next.lastModeratedAt = patch.lastModeratedAt ? Number(patch.lastModeratedAt) : null;
    if (typeof patch?.authorRole === "string") next.authorRole = String(patch.authorRole).trim().toUpperCase();
  }

  posts[idx] = next;
  await savePosts(posts);
  return { ok: true, post: next };
}

export async function deleteFeedPost({ actor, postId, allowDeveloperOverride = false }) {
  const posts = await loadPosts();
  const existing = posts.find((p) => p.postId === postId);
  if (!existing) return { ok: false, reason: "Not found" };

  const isOwner = actor?.id && existing.ownerUserId === actor.id;
  if (!isOwner && !allowDeveloperOverride) return { ok: false, reason: "Not allowed" };

  const next = posts.filter((p) => p.postId !== postId);
  await savePosts(next);
  return { ok: true };
}
