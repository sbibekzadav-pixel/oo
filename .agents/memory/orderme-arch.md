---
name: OrderMe app architecture
description: Key architectural decisions for the OrderMe Expo mobile app in this workspace.
---

# OrderMe Mobile Architecture

**Why:** The source repo uses React Navigation with nested navigators (AppNavigator → TabNavigator/AuthNavigator). Converting to Expo Router would require rewriting all screens. Keeping React Navigation was simpler.

**How to apply:**
- `artifacts/mobile/main` in `package.json` = `"index.ts"` (not `expo-router/entry`)
- No expo-router plugin in `app.json`
- Entry: `index.ts` → `registerRootComponent(App)` → `App.tsx` → `AppNavigator`
- Source at `artifacts/mobile/src/`
- Screens use `navigation.navigate(...)` imperative API throughout

**Key packages (devDependencies in mobile):**
- `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`
- `firebase` ^10
- `@react-navigation/*` are NOT in the pnpm catalog — they live as direct version strings in mobile/package.json

**Tab structure:** Home → Services → Map (center FAB) → Chats → Profile
