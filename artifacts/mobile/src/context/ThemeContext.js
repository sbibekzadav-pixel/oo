import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import { LightTheme, DarkNeoTheme } from '../theme/themes';
import { useAuth } from './AuthContext';

const STORAGE_KEY = '@orderme_theme';
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { user, updateProfile } = useAuth();
  const [mode, setModeState] = useState('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && (saved === 'dark' || saved === 'light')) {
          setModeState(saved);
        } else {
          // Default to black/dark theme as requested
          setModeState('dark');
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (user?.theme === 'dark' || user?.theme === 'light') {
      setModeState(user.theme);
      AsyncStorage.setItem(STORAGE_KEY, user.theme).catch(() => {});
    }
  }, [user?.id, user?.theme]);

  const theme = useMemo(() => (mode === 'dark' ? DarkNeoTheme : LightTheme), [mode]);

  const setMode = useCallback(
    async (next) => {
      if (next !== 'light' && next !== 'dark') return;
      setModeState(next);
      await AsyncStorage.setItem(STORAGE_KEY, next);
      if (user?.id) {
        try {
          await updateProfile({ theme: next });
        } catch (e) {
          console.warn('theme profile sync:', e?.message);
        }
      }
    },
    [user?.id, updateProfile],
  );

  const toggleTheme = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  const value = useMemo(
    () => ({
      ...theme,
      colors: theme.colors,
      shadows: theme.shadows,
      mode,
      isDark: mode === 'dark',
      setMode,
      toggleTheme,
      ready,
    }),
    [theme, mode, setMode, toggleTheme, ready],
  );

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#070b14' }}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      ...LightTheme,
      colors: LightTheme.colors,
      shadows: LightTheme.shadows,
      mode: 'light',
      isDark: false,
      setMode: async () => {},
      toggleTheme: () => {},
      ready: true,
    };
  }
  return ctx;
}

export function useColors() {
  return useTheme().colors;
}
