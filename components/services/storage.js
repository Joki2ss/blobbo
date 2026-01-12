import AsyncStorage from "@react-native-async-storage/async-storage";

export async function getJson(key, fallback = null) {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export async function setJson(key, value) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function remove(key) {
  await AsyncStorage.removeItem(key);
}
