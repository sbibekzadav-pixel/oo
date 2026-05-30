import { PATHS, dbGet, dbSet } from './rtdb';

export async function loadDeletedNotificationIds(uid) {
  if (!uid) return new Set();
  try {
    const meta = await dbGet(PATHS.userNotificationMeta(uid));
    const ids = meta?.deletedIds;
    return new Set(Array.isArray(ids) ? ids.map(String) : []);
  } catch {
    return new Set();
  }
}

export async function addDeletedNotificationId(uid, notificationId) {
  if (!uid || !notificationId) return;
  const set = await loadDeletedNotificationIds(uid);
  set.add(String(notificationId));
  try {
    await dbSet(PATHS.userNotificationMeta(uid), { deletedIds: [...set] });
  } catch (e) {
    console.warn('addDeletedNotificationId:', e?.message);
  }
}

export function applyDeletedFilter(list, deletedIds) {
  if (!deletedIds?.size) return list;
  return list.filter((n) => !deletedIds.has(String(n.id)));
}
