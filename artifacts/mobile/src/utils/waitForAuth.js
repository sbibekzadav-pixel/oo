import { auth } from '../config/firebase';

/** Poll until Firebase auth has a user (OAuth can finish after prompt dismisses). */
export async function waitForFirebaseUser(timeoutMs = 3500, intervalMs = 200) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (auth.currentUser) return auth.currentUser;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return auth.currentUser;
}
