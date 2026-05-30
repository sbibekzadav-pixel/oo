import { PATHS, dbPush } from './rtdb';

/**
 * Queue an item for the admin dashboard (bookings, vendor sign-ups, etc.).
 * Failures are logged only so user-facing submits still succeed.
 */
export async function notifyAdminInbox({ type, title, message, meta = {} }) {
  try {
    await dbPush(PATHS.adminInbox, {
      type,
      title,
      message,
      meta,
      read: false,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('notifyAdminInbox:', e?.message);
  }
}
