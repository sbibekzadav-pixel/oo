---
name: EAS Gradle worklets conflict
description: react-native-worklets 0.5.1 autolinks and duplicates Reanimated 4.x bundled worklets, causing EAS_BUILD_UNKNOWN_GRADLE_ERROR
---

## Rule
Never include `react-native-worklets` alongside `react-native-reanimated` 4.x.

**Why:** Reanimated 4.x bundles its own worklets runtime (`react-native-worklets-core`). Having the older `react-native-worklets: 0.5.1` package in package.json causes Gradle autolinking to include both, resulting in duplicate C++ symbols → `EAS_BUILD_UNKNOWN_GRADLE_ERROR`.

**How to apply:** If the project uses `react-native-reanimated ~4.x`, ensure `react-native-worklets` is NOT in package.json. Only `react-native-worklets-core` (the new one) is compatible and it's a transitive dep of reanimated — don't add it directly either.

Also remove any unused native modules from package.json (e.g. `react-native-keyboard-controller` if not imported anywhere) — they get autolinked by expo-modules-autolinking and can cause similar conflicts.

## Additional finding: New Architecture required
`react-native-worklets 0.5.1` declares `codegenConfig.type = "modules"` (TurboModule = New Architecture only).
Setting `newArchEnabled: false` in `app.json` while using worklets 0.5.x causes `EAS_BUILD_UNKNOWN_GRADLE_ERROR` because the TurboModule codegen cannot be compiled in Old Architecture mode.

**Fix:** Set `"newArchEnabled": true` in `app.json`. All packages in this project (reanimated 4.x, gesture-handler 2.x, screens 4.x, svg 15.x) support New Architecture.
