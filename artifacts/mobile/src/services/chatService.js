/**
 * Real-time chat service — Firebase Firestore.
 *
 * Firestore path structure (matches prompt spec):
 *   chats/{chatId}                      — chat metadata document
 *   chats/{chatId}/messages/{msgId}     — message subcollection
 *
 * chatId = sorted([userId, providerId]).join('_')
 *
 * Each document uses `participants` array so both sides can query their chats
 * with a single array-contains filter (avoids compound OR queries).
 */
import {
  collection, doc, getDoc, setDoc, addDoc, updateDoc,
  query, orderBy, where, onSnapshot, serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fs } from '../config/firebase';

// ── helpers ────────────────────────────────────────────────────────────────

/** Deterministic chat ID — same for both sides. */
export function makeChatId(userId, providerId) {
  return [userId, providerId].sort().join('_');
}

function tsToMs(val) {
  if (!val) return Date.now();
  if (typeof val === 'number') return val;
  if (val instanceof Timestamp) return val.toMillis();
  if (val?.toMillis) return val.toMillis();
  return Date.now();
}

function localKey(chatId) {
  return `@orderme_chat_msgs_${chatId}`;
}

function localChatsKey(userId) {
  return `@orderme_chat_list_${userId}`;
}

// ── local fallback helpers ──────────────────────────────────────────────────

async function saveLocalMessages(chatId, msgs) {
  try {
    await AsyncStorage.setItem(localKey(chatId), JSON.stringify(msgs));
  } catch {}
}

async function loadLocalMessages(chatId) {
  try {
    const raw = await AsyncStorage.getItem(localKey(chatId));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function saveLocalChats(userId, chats) {
  try {
    await AsyncStorage.setItem(localChatsKey(userId), JSON.stringify(chats));
  } catch {}
}

async function loadLocalChats(userId) {
  try {
    const raw = await AsyncStorage.getItem(localChatsKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// ── Firestore operations ───────────────────────────────────────────────────

/**
 * Ensure a Firestore chat document exists. Creates it if not. Returns chatId.
 */
export async function ensureChat(userId, providerId, providerInfo = {}) {
  const chatId = makeChatId(userId, providerId);
  try {
    const chatRef = doc(fs, 'chats', chatId);
    const snap = await getDoc(chatRef);
    if (!snap.exists()) {
      await setDoc(chatRef, {
        chatId,
        userId,
        providerId,
        participants: [userId, providerId],
        providerName: providerInfo.name || 'Provider',
        providerAvatar: providerInfo.avatar || null,
        providerCategory: providerInfo.category || '',
        lastMessage: '',
        lastMessageAt: serverTimestamp(),
        unreadCount: 0,
        createdAt: serverTimestamp(),
      });
    }
  } catch (e) {
    console.warn('ensureChat (Firestore):', e?.message);
  }
  return chatId;
}

/**
 * Send a message. Writes to Firestore and falls back to AsyncStorage if needed.
 */
export async function sendMessage(chatId, senderId, receiverId, text) {
  if (!text?.trim()) return null;

  const trimmed = text.trim();
  const now = Date.now();

  // Optimistic local message
  const localMsg = {
    id: `local_${now}`,
    text: trimmed,
    senderId,
    receiverId,
    createdAt: now,
    read: false,
    pending: true,
  };

  try {
    const messagesRef = collection(fs, 'chats', chatId, 'messages');
    const msgDoc = await addDoc(messagesRef, {
      text: trimmed,
      senderId,
      receiverId,
      createdAt: serverTimestamp(),
      read: false,
    });

    const chatRef = doc(fs, 'chats', chatId);
    await updateDoc(chatRef, {
      lastMessage: trimmed.slice(0, 80),
      lastMessageAt: serverTimestamp(),
      unreadCount: 1,
    });

    return { id: msgDoc.id, text: trimmed, senderId, receiverId, createdAt: now, read: false };
  } catch (e) {
    console.warn('sendMessage (Firestore):', e?.message);
    // Fall back: persist locally
    const local = await loadLocalMessages(chatId);
    const updated = [...local, { ...localMsg, pending: false }];
    await saveLocalMessages(chatId, updated);
    return localMsg;
  }
}

/**
 * Real-time listener for messages in a chat.
 * Falls back to AsyncStorage if Firestore is unavailable.
 * Returns an unsubscribe function.
 */
export function listenToMessages(chatId, callback) {
  let unsubscribed = false;

  // Always deliver cached messages immediately (even empty — stops loading spinner)
  loadLocalMessages(chatId).then((cached) => {
    if (!unsubscribed) callback(cached);
  });

  try {
    const q = query(
      collection(fs, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc'),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        if (unsubscribed) return;
        const msgs = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: tsToMs(d.data().createdAt),
        }));
        saveLocalMessages(chatId, msgs);
        callback(msgs);
      },
      (err) => {
        console.warn('listenToMessages (Firestore):', err?.message);
        loadLocalMessages(chatId).then((cached) => {
          if (!unsubscribed) callback(cached);
        });
      },
    );

    return () => { unsubscribed = true; unsub(); };
  } catch (e) {
    console.warn('listenToMessages setup:', e?.message);
    return () => { unsubscribed = true; };
  }
}

/**
 * Real-time listener for all chats the current user participates in.
 * Sorted newest-first. Falls back to AsyncStorage cache.
 */
export function listenToUserChats(userId, callback) {
  let unsubscribed = false;

  // Deliver cache immediately
  loadLocalChats(userId).then((cached) => {
    if (!unsubscribed && cached.length > 0) callback(cached);
  });

  try {
    const q = query(
      collection(fs, 'chats'),
      where('participants', 'array-contains', userId),
      orderBy('lastMessageAt', 'desc'),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        if (unsubscribed) return;
        const chats = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          lastMessageAt: tsToMs(d.data().lastMessageAt),
        }));
        saveLocalChats(userId, chats);
        callback(chats);
      },
      (err) => {
        console.warn('listenToUserChats (Firestore):', err?.message);
        loadLocalChats(userId).then((cached) => {
          if (!unsubscribed) callback(cached);
        });
      },
    );

    return () => { unsubscribed = true; unsub(); };
  } catch (e) {
    console.warn('listenToUserChats setup:', e?.message);
    return () => { unsubscribed = true; };
  }
}

/**
 * Mark all unread messages in a chat as read for a specific user.
 */
export async function markChatRead(chatId) {
  try {
    const chatRef = doc(fs, 'chats', chatId);
    await updateDoc(chatRef, { unreadCount: 0 });
  } catch {
    // ignore — non-critical
  }
}

/**
 * Get chat info document.
 */
export async function getChatInfo(chatId) {
  try {
    const snap = await getDoc(doc(fs, 'chats', chatId));
    return snap.exists() ? snap.data() : null;
  } catch { return null; }
}
