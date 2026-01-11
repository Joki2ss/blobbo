import { supabase } from "./authService";

export async function fetchFeedPosts() {
  const { data, error } = await supabase.from("feed_posts").select("id, title, description").order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}
