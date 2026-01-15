// Expo Snack compatible UUID generator
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'socials_posts_v1';

// SocialPost: { postId, ownerUserId, businessId, title, body, media[], hashtags[], targets[], status, createdAt, updatedAt }

export async function getPosts(userId = 'guest') {
  const all = await AsyncStorage.getItem(STORAGE_KEY);
  if (!all) return [];
  const parsed = JSON.parse(all);
  return parsed[userId] || [];
}

export async function savePost(userId = 'guest', post) {
  const all = await AsyncStorage.getItem(STORAGE_KEY);
  let parsed = all ? JSON.parse(all) : {};
  if (!parsed[userId]) parsed[userId] = [];
  if (!post.postId) post.postId = uuidv4();
  post.updatedAt = Date.now();
  if (!post.createdAt) post.createdAt = post.updatedAt;
  const idx = parsed[userId].findIndex(p => p.postId === post.postId);
  if (idx >= 0) parsed[userId][idx] = post;
  else parsed[userId].unshift(post);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  return post;
}

export async function deletePost(userId = 'guest', postId) {
  const all = await AsyncStorage.getItem(STORAGE_KEY);
  let parsed = all ? JSON.parse(all) : {};
  if (!parsed[userId]) return;
  parsed[userId] = parsed[userId].filter(p => p.postId !== postId);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
}
