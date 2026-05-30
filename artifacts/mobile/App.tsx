import 'react-native-gesture-handler';
import './src/config/firebase';
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StatusBar, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { DataProvider } from './src/context/DataContext';
import { SearchFilterProvider } from './src/context/SearchFilterContext';
import { NotificationsProvider } from './src/context/NotificationsContext';
import { BookingProvider } from './src/context/BookingContext';
import { BookmarksProvider } from './src/context/BookmarksContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import AppNavigator from './src/navigation/AppNavigator';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';

function AppShell() {
  const { colors, statusBar, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (Platform.OS === 'web') return;
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return undefined;
    const styleId = 'orderme-theme-scroll';
    let node = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!node) {
      node = document.createElement('style') as HTMLStyleElement;
      (node as HTMLStyleElement).id = styleId;
      document.head.appendChild(node as HTMLStyleElement);
    }
    (node as HTMLStyleElement).textContent = `
      html, body, #root { background: ${colors.background}; }
      * { scrollbar-color: ${colors.border} ${colors.background}; }
      ::-webkit-scrollbar { width: 10px; height: 10px; }
      ::-webkit-scrollbar-track { background: ${colors.background}; }
      ::-webkit-scrollbar-thumb { background: ${colors.border}; border-radius: 8px; }
    `;
    return () => {
      if (node) (node as HTMLStyleElement).textContent = '';
    };
  }, [colors.background, colors.border, isDark]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        translucent
        barStyle={statusBar}
        backgroundColor={isDark ? colors.background : 'transparent'}
      />
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <AppNavigator />
      </Animated.View>
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AuthProvider>
            <ThemeProvider>
              <LanguageProvider>
                <DataProvider>
                  <SearchFilterProvider>
                    <BookingProvider>
                      <NotificationsProvider>
                        <BookmarksProvider>
                          <AppShell />
                        </BookmarksProvider>
                      </NotificationsProvider>
                    </BookingProvider>
                  </SearchFilterProvider>
                </DataProvider>
              </LanguageProvider>
            </ThemeProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
