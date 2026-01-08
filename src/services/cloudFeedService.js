import { getSupabaseClient } from "./supabaseClient";

function toAppPost(row) {
  if (!row) return null;
  return {
    postId: row.post_id,
    ownerUserId: row.owner_user_id,
    ownerBusinessName: row.owner_business_name || "",
    ownerCategory: row.owner_category || "",
    location: row.location || null,

    planType: row.plan_type,
    isPermanent: !!row.is_permanent,

    title: row.title,
    description: row.description,

    keywords: Array.isArray(row.keywords) ? row.keywords : [],
    images: Array.isArray(row.images) ? row.images : [],
    rankingScore: Number(row.ranking_score || 0),

    visibilityStatus: row.visibility_status,

    pinnedRank: row.pinned_rank == null ? null : Number(row.pinned_rank),
    moderationTags: Array.isArray(row.moderation_tags) ? row.moderation_tags : [],

    authorRole: row.author_role,

    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
  };
}

function safeIlikeTerm(q) {
  const s = String(q || "").trim();
  if (!s) return null;
  // supabase-js builds a query string; escape %/_ by conservative replacement
  return s.replace(/[%_]/g, " ");
}

export async function cloudSearchPublicFeedPosts({ query = "", limit = 50 } = {}) {
  const supabase = getSupabaseClient();

  const q = safeIlikeTerm(query);
  let request = supabase
    .from("public_feed_posts")
    .select(
      "post_id, owner_user_id, owner_business_name, owner_category, location, plan_type, is_permanent, title, description, keywords, images, ranking_score, visibility_status, pinned_rank, moderation_tags, author_role, created_at, updated_at"
    )
    .order("pinned_rank", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(Math.max(1, Math.min(100, Number(limit) || 50)));

  if (q) {
    request = request.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  }

  const { data, error } = await request;
  if (error) throw new Error(error.message);

  const rows = Array.isArray(data) ? data : [];
  return rows.map(toAppPost).filter(Boolean);
}

export async function cloudListAllFeedPostsForDeveloper({ limit = 200 } = {}) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("feed_posts")
    .select(
      "post_id, owner_user_id, owner_business_name, owner_category, location, plan_type, is_permanent, title, description, keywords, images, ranking_score, visibility_status, pinned_rank, moderation_tags, author_role, created_at, updated_at"
    )
    .order("created_at", { ascending: false })
    .limit(Math.max(1, Math.min(500, Number(limit) || 200)));

  if (error) throw new Error(error.message);
  const rows = Array.isArray(data) ? data : [];
  return rows.map(toAppPost).filter(Boolean);
}

export async function cloudGetFeedPostById({ postId, asDeveloper = false }) {
  const supabase = getSupabaseClient();
  const table = asDeveloper ? "feed_posts" : "public_feed_posts";
  const { data, error } = await supabase
    .from(table)
    .select(
      "post_id, owner_user_id, owner_business_name, owner_category, location, plan_type, is_permanent, title, description, keywords, images, ranking_score, visibility_status, pinned_rank, moderation_tags, author_role, created_at, updated_at"
    )
    .eq("post_id", postId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return toAppPost(data);
}

export async function cloudCreateFeedPost({ post }) {
  const supabase = getSupabaseClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw new Error(userErr.message);
  const uid = userData?.user?.id;
  if (!uid) throw new Error("Not authenticated");

  const payload = {
    owner_user_id: uid,

    owner_business_name: String(post?.ownerBusinessName || "").trim().slice(0, 60),
    owner_category: String(post?.ownerCategory || "").trim().slice(0, 40),
    location: post?.location && typeof post.location === "object" ? post.location : null,

    plan_type: String(post?.planType || "").trim(),
    is_permanent: !!post?.isPermanent,

    title: String(post?.title || "").trim().slice(0, 70),
    description: String(post?.description || "").trim(),

    keywords: Array.isArray(post?.keywords) ? post.keywords : [],
    images: Array.isArray(post?.images) ? post.images : [],

    // Let DB defaults enforce moderation/platform fields.
    author_role: String(post?.authorRole || "USER").trim().toUpperCase(),
  };

  const { data, error } = await supabase
    .from("feed_posts")
    .insert(payload)
    .select(
      "post_id, owner_user_id, owner_business_name, owner_category, location, plan_type, is_permanent, title, description, keywords, images, ranking_score, visibility_status, pinned_rank, moderation_tags, author_role, created_at, updated_at"
    )
    .single();

  if (error) throw new Error(error.message);
  return { ok: true, post: toAppPost(data) };
}

export async function cloudUpdateFeedPost({ postId, patch }) {
  const supabase = getSupabaseClient();

  const payload = {};
  if (typeof patch?.ownerBusinessName === "string") payload.owner_business_name = patch.ownerBusinessName.trim().slice(0, 60);
  if (typeof patch?.ownerCategory === "string") payload.owner_category = patch.ownerCategory.trim().slice(0, 40);
  if (typeof patch?.title === "string") payload.title = patch.title.trim().slice(0, 70);
  if (typeof patch?.description === "string") payload.description = String(patch.description);
  if (Array.isArray(patch?.keywords)) payload.keywords = patch.keywords;
  if (Array.isArray(patch?.images)) payload.images = patch.images;
  if (patch?.location && typeof patch.location === "object") payload.location = patch.location;

  const { data, error } = await supabase
    .from("feed_posts")
    .update(payload)
    .eq("post_id", postId)
    .select(
      "post_id, owner_user_id, owner_business_name, owner_category, location, plan_type, is_permanent, title, description, keywords, images, ranking_score, visibility_status, pinned_rank, moderation_tags, author_role, created_at, updated_at"
    )
    .single();

  if (error) throw new Error(error.message);
  return { ok: true, post: toAppPost(data) };
}

export async function cloudDeleteFeedPost({ postId }) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("feed_posts").delete().eq("post_id", postId);
  if (error) throw new Error(error.message);
  return { ok: true };
}
