import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import OnboardingScreen from '../screens/Onboarding/OnboardingScreen';
import AboutScreen from '../screens/Info/AboutScreen';
import VendorRegistrationScreen from '../screens/Info/VendorRegistrationScreen';
import { isOnboardingDone } from '../utils/onboardingStorage';
import { useTheme } from '../context/ThemeContext';
import AppLogo from '../components/AppLogo';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  const [initialRoute, setInitialRoute] = useState(null);
  const { colors } = useTheme();

  useEffect(() => {
    isOnboardingDone().then((done) => {
      setInitialRoute(done ? 'Login' : 'Onboarding');
    });
  }, []);

  if (!initialRoute) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <AppLogo size="large" style={{ marginBottom: 20 }} />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={initialRoute}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen
        name="VendorRegistration"
        component={VendorRegistrationScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
