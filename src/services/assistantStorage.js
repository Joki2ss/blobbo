// Expo Snack compatible UUID generator
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'assistant_conversations_v1';

// ChatMessage: { id, conversationId, role: "user"|"assistant", text, attachments[], createdAt }
// Attachment: { id, type: "image"|"file", uri, name, size, mime }

export async function getConversation(userId = 'guest') {
  const all = await AsyncStorage.getItem(STORAGE_KEY);
  if (!all) return [];
  const parsed = JSON.parse(all);
  return parsed[userId] || [];
}

export async function saveMessage(userId = 'guest', message) {
  const all = await AsyncStorage.getItem(STORAGE_KEY);
  let parsed = all ? JSON.parse(all) : {};
  if (!parsed[userId]) parsed[userId] = [];
  parsed[userId].push({ ...message, id: uuidv4(), createdAt: Date.now() });
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
}

export async function clearConversation(userId = 'guest') {
  const all = await AsyncStorage.getItem(STORAGE_KEY);
  let parsed = all ? JSON.parse(all) : {};
  parsed[userId] = [];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
}
