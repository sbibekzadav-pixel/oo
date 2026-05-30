---
name: OrderMe navigation nesting
description: Tab screens are nested inside MainTabs stack screen — never navigate to them by bare name.
---

# OrderMe Navigation Nesting Rule

**Rule:** The bottom tab screens (`Home`, `Services`, `Map`, `Chats`, `Profile`) are nested inside the `MainTabs` stack screen in `AppNavigator`. You must navigate to them via the parent:

```js
// CORRECT
navigation.navigate('MainTabs', { screen: 'Services' });
navigation.navigate('MainTabs', { screen: 'Chats' });

// WRONG — throws "action not handled by any navigator"
navigation.navigate('Services');
navigation.navigate('Chats');
```

**Why:** AppNavigator uses `createNativeStackNavigator`. `MainTabs` is the name of the tab navigator screen inside it. Direct navigation to a tab screen name bypasses the nesting and throws a runtime error (development warning, silent in production).

**How to apply:** Any time you add a button or link that should open a tab screen from outside the tab bar (e.g., from a modal, stack screen, or deep link), always use the `MainTabs` + `screen` pattern.
