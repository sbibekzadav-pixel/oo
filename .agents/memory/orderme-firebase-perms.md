---
name: Firebase RTDB permission handling
description: RTDB returns permission_denied for all user paths in web preview; use AsyncStorage-first pattern.
---

# Firebase RTDB Permission Handling

**Rule:** In the Replit web preview domain, Firebase RTDB returns `permission_denied` for all user-scoped paths (`/users/uid/...`, `/catalog`, etc.). This is expected — the Firebase project's RTDB security rules do not whitelist the Replit preview domain.

**How to apply:**
- All Firebase RTDB calls must be wrapped in try/catch and never block the UI.
- Use AsyncStorage as the primary persistence layer; Firebase RTDB is a best-effort background sync only.
- `BookmarksContext`, `AuthContext`, and `BookingContext` already follow this pattern — keep it consistent for any new context that syncs to RTDB.
- The `dbListen` utility in `src/services/rtdb.js` returns a no-op unsubscribe on error — safe to call unconditionally.

**Firestore** (used for chat) may also show "client is offline" in web preview — handled gracefully with try/catch in `chatService.js`.
