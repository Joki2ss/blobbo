import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

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
