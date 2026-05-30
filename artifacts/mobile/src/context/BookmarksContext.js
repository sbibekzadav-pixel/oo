/**
 * BookmarksContext — AsyncStorage-first, Firebase as optional background sync.
 *
 * AsyncStorage is the primary storage: bookmarks survive restarts, logouts,
 * and any Firebase permission errors. Firebase RTDB is written as best-effort
 * background sync (try/catch, never blocks the UI).
 */
import React, {
  createContext, useContext, useState, useEffect,
  useCallback, useMemo, useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PATHS, dbListen, dbSet, dbRemove } from '../services/rtdb';
import { useAuth } from './AuthContext';

const BookmarksContext = createContext(null);

function storageKey(userId) {
  return `@orderme_bookmarks_v2_${userId}`;
}

function bookmarkKey(type, id) {
  return `${type}_${id}`;
}

function buildPayload(type, item) {
  if (type === 'provider') {
    return {
      type: 'provider',
      id: item.id,
      name: item.name || '',
      avatar: item.avatar || null,
      location: item.location || '',
      category: item.category || '',
      addedAt: new Date().toISOString(),
    };
  }
  return {
    type: 'service',
    id: item.id,
    title: item.title || '',
    image: item.image || null,
    category: item.category || '',
    providerId: item.providerId || '',
    addedAt: new Date().toISOString(),
  };
}

export function BookmarksProvider({ children }) {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState({});
  const syncing = useRef(false);
  const pendingRef = useRef({});

  // ── 1. Load from AsyncStorage on user change ────────────────────────────
  useEffect(() => {
    if (!user?.id) {
      setBookmarks({});
      return undefined;
    }

    let cancelled = false;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey(user.id));
        if (!cancelled && raw) {
          setBookmarks(JSON.parse(raw));
        }
      } catch (e) {
        console.warn('bookmarks load local:', e?.message);
      }
    })();

    // ── 2. Try RTDB sync (best-effort, never fails the UI) ───────────────
    let unsubRtdb = () => {};
    try {
      unsubRtdb = dbListen(PATHS.userBookmarks(user.id), (val) => {
        if (cancelled) return;
        if (val && typeof val === 'object') {
          setBookmarks((prev) => {
            const merged = { ...prev, ...val };
            // async save without blocking
            AsyncStorage.setItem(storageKey(user.id), JSON.stringify(merged)).catch(() => {});
            return merged;
          });
        }
      });
    } catch {
      // Firebase unavailable — AsyncStorage data already loaded
    }

    return () => {
      cancelled = true;
      unsubRtdb();
    };
  }, [user?.id]);

  // ── 3. Persist helpers ──────────────────────────────────────────────────
  const persist = useCallback(async (userId, next) => {
    try {
      await AsyncStorage.setItem(storageKey(userId), JSON.stringify(next));
    } catch (e) {
      console.warn('bookmarks persist:', e?.message);
    }
  }, []);

  const syncToFirebase = useCallback(async (path, value) => {
    try {
      if (value === null) {
        await dbRemove(path);
      } else {
        await dbSet(path, value);
      }
    } catch {
      // Firebase permission denied — local storage is already saved, ignore
    }
  }, []);

  // ── 4. Toggle ────────────────────────────────────────────────────────────
  const toggleBookmark = useCallback(
    async (type, item) => {
      if (!user?.id || !item?.id) return;
      const key = bookmarkKey(type, item.id);
      const path = `${PATHS.userBookmarks(user.id)}/${key}`;

      setBookmarks((prev) => {
        let next;
        if (prev[key]) {
          // Remove
          const { [key]: _removed, ...rest } = prev;
          next = rest;
          persist(user.id, next);
          syncToFirebase(path, null);
        } else {
          // Add
          const payload = buildPayload(type, item);
          next = { ...prev, [key]: payload };
          persist(user.id, next);
          syncToFirebase(path, payload);
        }
        return next;
      });
    },
    [user?.id, persist, syncToFirebase],
  );

  const isBookmarked = useCallback(
    (type, id) => Boolean(bookmarks[bookmarkKey(type, id)]),
    [bookmarks],
  );

  const bookmarkList = useMemo(() => Object.values(bookmarks), [bookmarks]);

  const value = useMemo(
    () => ({ bookmarks, bookmarkList, isBookmarked, toggleBookmark }),
    [bookmarks, bookmarkList, isBookmarked, toggleBookmark],
  );

  return (
    <BookmarksContext.Provider value={value}>
      {children}
    </BookmarksContext.Provider>
  );
}

export function useBookmarks() {
  const ctx = useContext(BookmarksContext);
  if (!ctx) throw new Error('useBookmarks must be used within BookmarksProvider');
  return ctx;
}
