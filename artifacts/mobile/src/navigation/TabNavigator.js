import React, { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

import HomeScreen from '../screens/Home/HomeScreen';
import ServicesScreen from '../screens/Services/ServicesScreen';
import MapScreen from '../screens/Map/MapScreen';
import ChatsScreen from '../screens/Chats/ChatsScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { colors, shadows } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);

  const TabBarIcon = ({ name, color, focused }) => (
    <View style={styles.iconWrapper}>
      <Ionicons name={name} size={24} color={color} />
      {focused && <View style={[styles.dot, { backgroundColor: color }]} />}
    </View>
  );

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarLabelStyle: styles.tabLabel,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} focused={focused} />
          ),
          tabBarLabel: t('home') || 'Home',
        }}
      />
      <Tab.Screen
        name="Services"
        component={ServicesScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'grid' : 'grid-outline'} color={color} focused={focused} />
          ),
          tabBarLabel: t('services') || 'Services',
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarIcon: () => (
            <View style={styles.mapTabIcon}>
              <Ionicons name="location" size={28} color="#fff" />
            </View>
          ),
          tabBarLabel: '',
        }}
      />
      <Tab.Screen
        name="Chats"
        component={ChatsScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'chatbubbles' : 'chatbubbles-outline'} color={color} focused={focused} />
          ),
          tabBarLabel: 'Chats',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'person' : 'person-outline'} color={color} focused={focused} />
          ),
          tabBarLabel: t('profile') || 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

const createStyles = (COLORS, SHADOWS) => StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.tabBar,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: Platform.OS === 'web' ? 84 : 70,
    paddingBottom: Platform.OS === 'web' ? 20 : 10,
    paddingTop: 8,
    ...SHADOWS.lg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  tabLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  iconWrapper: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
  mapTabIcon: {
    backgroundColor: COLORS.primary,
    borderRadius: 20, width: 52, height: 52,
    justifyContent: 'center', alignItems: 'center', marginTop: -20,
    shadowColor: COLORS.glow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
});
