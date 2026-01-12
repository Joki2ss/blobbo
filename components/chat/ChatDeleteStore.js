import AsyncStorage from "@react-native-async-storage/async-storage";

function keyFor(userId) {
  return `sxr_chat_deleted_threads_v1:${String(userId || "")}`;
}

export async function listDeletedThreadIds({ userId }) {
  const raw = await AsyncStorage.getItem(keyFor(userId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

export async function markThreadDeleted({ userId, threadId }) {
  const list = await listDeletedThreadIds({ userId });
  const id = String(threadId || "");
  if (!id) return;
  const next = Array.from(new Set([id, ...list])).slice(0, 500);
  await AsyncStorage.setItem(keyFor(userId), JSON.stringify(next));
}

export async function unmarkThreadDeleted({ userId, threadId }) {
  const list = await listDeletedThreadIds({ userId });
  const id = String(threadId || "");
  if (!id) return;
  const next = list.filter((x) => x !== id);
  await AsyncStorage.setItem(keyFor(userId), JSON.stringify(next));
}
