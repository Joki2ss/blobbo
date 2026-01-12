import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "laab_public_feed_posts_v1";

export async function loadPosts() {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function savePosts(posts) {
  await AsyncStorage.setItem(KEY, JSON.stringify(Array.isArray(posts) ? posts : []));
}
