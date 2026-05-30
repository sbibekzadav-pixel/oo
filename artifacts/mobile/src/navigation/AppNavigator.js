import React, { useMemo } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AppLogo from '../components/AppLogo';

import TabNavigator from './TabNavigator';
import AuthNavigator from './AuthNavigator';
import ServiceDetailScreen from '../screens/Services/ServiceDetailScreen';
import ProviderProfileScreen from '../screens/Services/ProviderProfileScreen';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';
import AllServicesScreen from '../screens/Services/AllServicesScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import AboutScreen from '../screens/Info/AboutScreen';
import VendorRegistrationScreen from '../screens/Info/VendorRegistrationScreen';
import BookingScreen from '../screens/Booking/BookingScreen';
import BookingConfirmScreen from '../screens/Booking/BookingConfirmScreen';
import MyBookingsScreen from '../screens/MyBookings/MyBookingsScreen';
import TrackingScreen from '../screens/Map/TrackingScreen';
import SavedAddressesScreen from '../screens/Profile/SavedAddressesScreen';
import ChatScreen from '../screens/Chats/ChatScreen';
import BookmarksScreen from '../screens/Profile/BookmarksScreen';

const Stack = createNativeStackNavigator();

function AuthLoadingScreen() {
  const { colors } = useTheme();
  return (
    <View style={[styles.loading, { backgroundColor: colors.background }]}>
      <AppLogo size="large" style={{ marginBottom: 24 }} />
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export default function AppNavigator() {
  const { authInitializing, isLoggedIn } = useAuth();
  const { colors, isDark } = useTheme();

  const navTheme = useMemo(
    () => ({
      ...(isDark ? DarkTheme : DefaultTheme),
      colors: {
        ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
        primary: colors.primary,
        background: colors.background,
        card: colors.card,
        text: colors.text,
        border: colors.border,
        notification: colors.danger,
      },
    }),
    [colors, isDark],
  );

  if (authInitializing) {
    return <AuthLoadingScreen />;
  }

  return (
    <NavigationContainer key={isLoggedIn ? 'main-app' : 'auth-flow'} theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {isLoggedIn ? (
          <>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen
              name="ServiceDetail"
              component={ServiceDetailScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="ProviderProfile"
              component={ProviderProfileScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="AllServices"
              component={AllServicesScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="About"
              component={AboutScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="VendorRegistration"
              component={VendorRegistrationScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="Booking"
              component={BookingScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="BookingConfirm"
              component={BookingConfirmScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="MyBookings"
              component={MyBookingsScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="Tracking"
              component={TrackingScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="SavedAddresses"
              component={SavedAddressesScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="Bookmarks"
              component={BookmarksScreen}
              options={{ animation: 'slide_from_right' }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
