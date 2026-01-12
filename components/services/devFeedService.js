import { createFeedPost, listFeedPosts, updateFeedPost } from "../feed/FeedService";
import { VISIBILITY_STATUS } from "../feed/FeedPlans";
import { requireDeveloper } from "./rbac";
import { AUDIT_ACTION_TYPES, logAudit } from "./auditService";
import { normalizePinnedRank, normalizeTagList } from "../security/inputValidation";
import { devRpcBulkReorderPins, devRpcUpdatePost } from "./devRpcService";

function normalizeTags(list) {
  return normalizeTagList(list, { maxItems: 12, maxLen: 28, keepCase: true });
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

  if (backendMode === "CLOUD") {
    await devRpcUpdatePost({ postId, visibilityStatus, reason: String(reason || "").trim() || null });
    return { ok: true };
  }

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

  if (backendMode === "CLOUD") {
    const tags = normalizeTags(moderationTags);
    await devRpcUpdatePost({ postId, moderationTags: tags, reason: String(reason || "").trim() || null });
    return { ok: true };
  }

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

  if (backendMode === "CLOUD") {
    const rank = normalizePinnedRank(pinnedRank);
    await devRpcUpdatePost({ postId, pinnedRank: rank, reason: String(reason || "").trim() || null });
    return { ok: true };
  }

  const rank = normalizePinnedRank(pinnedRank);
  const patch = {
    pinnedRank: rank,
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

  if (backendMode === "CLOUD") {
    // Not implemented yet: developer-authored platform posts require an explicit RPC.
    throw new Error("CLOUD: Platform post creation is not configured yet.");
  }

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

export async function devBulkReorderPinnedRanks({ user, backendMode, developerUnlocked, items, reason }) {
  requireDeveloper({ user, backendMode, developerUnlocked });
  if (backendMode === "CLOUD") {
    const list = Array.isArray(items) ? items : [];
    const normalized = list
      .map((x) => ({
        post_id: x?.postId || x?.post_id,
        pinned_rank: normalizePinnedRank(x?.pinnedRank ?? x?.pinned_rank),
      }))
      .filter((x) => typeof x.post_id === "string" && x.post_id.length > 0);
    const count = await devRpcBulkReorderPins({ items: normalized, reason: String(reason || "").trim() || null });
    return { ok: true, count };
  }
  throw new Error("MOCK: bulk reorder not wired");
}
