import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { PATHS, mapToArray, dbListen, dbUpdate, dbSet, dbRemove, dbPush } from '../services/rtdb';
import { DEFAULT_NOTIFICATIONS } from '../data/seedCatalog';
import { useAuth } from './AuthContext';
import {
  loadDeletedNotificationIds,
  addDeletedNotificationId,
  applyDeletedFilter,
} from '../services/notificationMeta';
import { relativeTimeFromNow } from '../utils/deviceSchedule';

const NotificationsContext = createContext(null);
const LOAD_TIMEOUT_MS = 4000;

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const gotRemoteRef = useRef(false);

  useEffect(() => {
    gotRemoteRef.current = false;

    if (!user?.id) {
      setNotifications([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    const timeout = setTimeout(() => {
      if (!cancelled && !gotRemoteRef.current) setLoading(false);
    }, LOAD_TIMEOUT_MS);

    const syncFromRemote = async (val) => {
      const deletedIds = await loadDeletedNotificationIds(user.id);
      const remote = applyDeletedFilter(mapToArray(val || {}), deletedIds);
      remote.sort((a, b) => (a.read === b.read ? 0 : a.read ? 1 : -1));
      if (!cancelled) {
        setNotifications(remote);
        setLoading(false);
      }
    };

    const unsub = dbListen(PATHS.userNotifications(user.id), (val) => {
      if (cancelled) return;
      gotRemoteRef.current = true;
      syncFromRemote(val).catch((e) => console.warn('notifications sync:', e?.message));
    });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      unsub();
    };
  }, [user?.id]);

  const markAsRead = useCallback(
    async (notificationId) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
      );
      if (!user?.id || String(notificationId).startsWith('offline_')) return;
      try {
        await dbUpdate(`${PATHS.userNotifications(user.id)}/${notificationId}`, { read: true });
      } catch (e) {
        console.warn('markAsRead:', e?.message);
      }
    },
    [user?.id],
  );

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (!user?.id) return;
    try {
      const updates = {};
      notifications.forEach((n) => {
        if (!n.read && !String(n.id).startsWith('offline_')) updates[`${n.id}/read`] = true;
      });
      if (Object.keys(updates).length) {
        await dbUpdate(PATHS.userNotifications(user.id), updates);
      }
    } catch (e) {
      console.warn('markAllRead:', e?.message);
    }
  }, [user?.id, notifications]);

  const addNotification = useCallback(
    async (payload) => {
      const base = {
        type: payload.type || 'booking',
        icon: payload.icon || 'checkmark-circle',
        color: payload.color || '#10b981',
        bg: payload.bg || '#ecfdf5',
        title: payload.title,
        message: payload.message,
        time: relativeTimeFromNow(Date.now()),
        read: false,
        createdAt: new Date().toISOString(),
      };

      if (!user?.id) {
        const offline = { ...base, id: `offline_${Date.now()}` };
        setNotifications((prev) => [offline, ...prev]);
        return offline;
      }

      try {
        const id = await dbPush(PATHS.userNotifications(user.id), base);
        const entry = { ...base, id };
        setNotifications((prev) => [entry, ...prev.filter((n) => n.id !== entry.id)]);
        return entry;
      } catch (e) {
        console.warn('addNotification remote:', e?.message);
        const fallback = { ...base, id: `local_${Date.now()}` };
        setNotifications((prev) => [fallback, ...prev]);
        return fallback;
      }
    },
    [user?.id],
  );

  const removeNotification = useCallback(
    async (notificationId) => {
      const id = String(notificationId);
      if (user?.id) await addDeletedNotificationId(user.id, id);

      setNotifications((prev) => prev.filter((n) => String(n.id) !== id));

      if (!user?.id) return;
      try {
        await dbRemove(`${PATHS.userNotifications(user.id)}/${notificationId}`);
      } catch (e) {
        console.warn('removeNotification:', e?.message);
      }
    },
    [user?.id],
  );

  const clearAllNotifications = useCallback(async () => {
    if (user?.id) {
      const ids = notifications.map((n) => String(n.id));
      await Promise.all(ids.map((id) => addDeletedNotificationId(user.id, id)));
    }

    setNotifications([]);

    if (!user?.id) return;
    try {
      await dbSet(PATHS.userNotifications(user.id), {});
    } catch (e) {
      console.warn('clearAllNotifications:', e?.message);
    }
  }, [user?.id, notifications]);

  const seedIfEmpty = useCallback(async () => {
    if (!user?.id) return;
    const defaults = DEFAULT_NOTIFICATIONS.map((n) => ({ ...n }));
    setNotifications(defaults);
    try {
      const map = defaults.reduce((acc, n) => {
        acc[n.id] = n;
        return acc;
      }, {});
      await dbSet(PATHS.userNotifications(user.id), map);
    } catch (e) {
      console.warn('seedIfEmpty:', e?.message);
    }
  }, [user?.id]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        loading,
        markAsRead,
        markAllRead,
        addNotification,
        removeNotification,
        clearAllNotifications,
        seedIfEmpty,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
