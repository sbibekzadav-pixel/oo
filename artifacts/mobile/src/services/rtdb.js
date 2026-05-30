import { ref, get, set, update, push, onValue, off, remove } from 'firebase/database';
import { rtdb } from '../config/firebase';

export const PATHS = {
  catalog: 'catalog',
  catalogMeta: 'catalog/meta',
  catalogServices: 'catalog/services',
  catalogProviders: 'catalog/providers',
  catalogHomeCategories: 'catalog/homeCategories',
  catalogServiceCategories: 'catalog/serviceCategories',
  catalogConfig: 'catalog/config',
  catalogDefaultNotifications: 'catalog/defaultNotifications',
  catalogBanners: 'catalog/banners',
  vendorRegistrations: 'vendorRegistrations',
  adminInbox: 'adminInbox',
  userProfile: (uid) => `users/${uid}/profile`,
  userBookings: (uid) => `users/${uid}/bookings`,
  userNotifications: (uid) => `users/${uid}/notifications`,
  userNotificationMeta: (uid) => `users/${uid}/notificationMeta`,
  userBookmarks: (uid) => `users/${uid}/bookmarks`,
  userChatHistory: (uid) => `users/${uid}/chatHistory`,
};

export function mapToArray(obj) {
  if (!obj || typeof obj !== 'object') return [];
  return Object.entries(obj).map(([key, value]) => ({
    ...value,
    id: value?.id ?? key,
  }));
}

export function arrayToMap(arr) {
  return (arr || []).reduce((acc, item) => {
    if (item?.id) acc[item.id] = { ...item };
    return acc;
  }, {});
}

export function dbRef(path) {
  return ref(rtdb, path);
}

export async function dbGet(path) {
  const snap = await get(dbRef(path));
  return snap.val();
}

export async function dbSet(path, value) {
  await set(dbRef(path), value);
}

export async function dbUpdate(path, value) {
  await update(dbRef(path), value);
}

export async function dbRemove(path) {
  await remove(dbRef(path));
}

export async function dbPush(path, value) {
  const newRef = push(dbRef(path));
  await set(newRef, { ...value, id: newRef.key });
  return newRef.key;
}

export function dbListen(path, callback) {
  const r = dbRef(path);
  const handler = (snapshot) => {
    try {
      callback(snapshot.val());
    } catch (e) {
      console.warn('dbListen callback error:', path, e);
    }
  };
  const errorHandler = (error) => {
    console.warn('dbListen error:', path, error?.message);
    callback(null);
  };
  onValue(r, handler, errorHandler);
  return () => off(r, 'value', handler);
}
