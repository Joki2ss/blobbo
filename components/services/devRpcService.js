import { getSupabaseClient } from "./supabaseClient";

export async function devRpcUpdatePost({ postId, visibilityStatus = null, pinnedRank = null, moderationTags = null, reason = "" }) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("dev_update_post", {
    p_post_id: postId,
    p_visibility_status: visibilityStatus,
    p_pinned_rank: pinnedRank,
    p_moderation_tags: moderationTags,
    p_reason: reason || null,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function devRpcBulkReorderPins({ items, reason = "" }) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("dev_bulk_reorder_pins", {
    p_items: items,
    p_reason: reason || null,
  });
  if (error) throw new Error(error.message);
  return data;
}
