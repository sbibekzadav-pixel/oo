import { PATHS, dbGet, dbSet } from './rtdb';

const MAX_MESSAGES = 80;

export async function loadChatHistory(uid) {
  if (!uid) return [];
  try {
    const val = await dbGet(PATHS.userChatHistory(uid));
    return Array.isArray(val?.messages) ? val.messages : [];
  } catch {
    return [];
  }
}

export async function saveChatHistory(uid, messages) {
  if (!uid || !Array.isArray(messages)) return;
  try {
    await dbSet(PATHS.userChatHistory(uid), {
      messages: messages.slice(-MAX_MESSAGES),
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('saveChatHistory:', e?.message);
  }
}
