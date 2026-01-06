import { createFeedPost, listFeedPosts, updateFeedPost } from "../feed/FeedService";
import { VISIBILITY_STATUS } from "../feed/FeedPlans";
import { requireDeveloper } from "./rbac";
import { AUDIT_ACTION_TYPES, logAudit } from "./auditService";

function normalizeTags(list) {
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

export async function devSearchPosts({ user, backendMode, developerUnlocked, query = "" }) {
  requireDeveloper({ user, backendMode, developerUnlocked });
  const list = await listFeedPosts({ includeAllForDeveloper: true });
  const q = String(query || "").trim().toLowerCase();
  if (!q) return list;
  return list.filter((p) => {
    const hay = [p.postId, p.ownerUserId, p.ownerBusinessName, p.ownerCategory, p.title, p.description]
      .filter(Boolean)
      .map((x) => String(x).toLowerCase())
      .join(" \n ");
    return hay.includes(q);
  });
}

export async function devSetPostVisibility({ user, backendMode, developerUnlocked, postId, visibilityStatus, reason }) {
  requireDeveloper({ user, backendMode, developerUnlocked });

  const patch = {
    visibilityStatus,
    lastModeratedByUserId: user?.id || "",
    lastModeratedAt: Date.now(),
  };

  const res = await updateFeedPost({ actor: user, postId, patch, allowDeveloperOverride: true });
  if (res?.ok) {
    const actionType =
      visibilityStatus === VISIBILITY_STATUS.DELETED
        ? AUDIT_ACTION_TYPES.POST_DELETE
        : visibilityStatus === VISIBILITY_STATUS.PAUSED
          ? AUDIT_ACTION_TYPES.POST_HIDE
          : AUDIT_ACTION_TYPES.POST_EDIT;

    await logAudit({
      actorUserId: user?.id,
      actionType,
      targetType: "post",
      targetId: postId,
      metadata: { reason: String(reason || "").trim() || null, changedFields: ["visibilityStatus"] },
    });
  }
  return res;
}

export async function devSetModerationTags({ user, backendMode, developerUnlocked, postId, moderationTags, reason }) {
  requireDeveloper({ user, backendMode, developerUnlocked });

  const tags = normalizeTags(moderationTags);
  const patch = {
    moderationTags: tags,
    lastModeratedByUserId: user?.id || "",
    lastModeratedAt: Date.now(),
  };

  const res = await updateFeedPost({ actor: user, postId, patch, allowDeveloperOverride: true });
  if (res?.ok) {
    await logAudit({
      actorUserId: user?.id,
      actionType: AUDIT_ACTION_TYPES.POST_EDIT,
      targetType: "post",
      targetId: postId,
      metadata: { reason: String(reason || "").trim() || null, changedFields: ["moderationTags"] },
    });
  }
  return res;
}

export async function devSetPinnedRank({ user, backendMode, developerUnlocked, postId, pinnedRank, reason }) {
  requireDeveloper({ user, backendMode, developerUnlocked });

  const rank = pinnedRank === null || pinnedRank === undefined || pinnedRank === "" ? null : Number(pinnedRank);
  const patch = {
    pinnedRank: Number.isFinite(rank) ? rank : null,
    lastModeratedByUserId: user?.id || "",
    lastModeratedAt: Date.now(),
  };

  const res = await updateFeedPost({ actor: user, postId, patch, allowDeveloperOverride: true });
  if (res?.ok) {
    await logAudit({
      actorUserId: user?.id,
      actionType: patch.pinnedRank === null ? AUDIT_ACTION_TYPES.POST_UNPIN : AUDIT_ACTION_TYPES.POST_PIN,
      targetType: "post",
      targetId: postId,
      metadata: { reason: String(reason || "").trim() || null, newPinnedRank: patch.pinnedRank },
    });
  }
  return res;
}

export async function devCreateAnnouncement({ user, backendMode, developerUnlocked, title, html, tags }) {
  requireDeveloper({ user, backendMode, developerUnlocked });

  const res = await createFeedPost({
    actor: user,
    post: {
      planType: "WELCOME",
      isPermanent: true,
      ownerBusinessName: "Platform update",
      ownerCategory: "platform",
      title: String(title || "").trim(),
      description: String(html || "").trim(),
      keywords: normalizeTags(tags).map((t) => t.replace(/^#/, "")),
      images: [],
      rankingScore: 999,
      location: null,
      authorRole: "DEVELOPER",
    },
    allowDeveloperOverride: true,
  });

  if (res?.ok && res?.post?.postId) {
    await logAudit({
      actorUserId: user?.id,
      actionType: AUDIT_ACTION_TYPES.POST_CREATE,
      targetType: "post",
      targetId: res.post.postId,
      metadata: { changedFields: ["title", "description"] },
    });
  }

  return res;
}
