import { Platform } from 'react-native';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyAKpanJuQEEpxOsoCCR9jjdDj2ZXpi_55Y',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'orderme-f0740.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'orderme-f0740',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '14466648859',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '1:14466648859:web:166f8b612f04adb5a1a1be',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ?? 'G-NGD0DG6TX4',
  databaseURL: (() => {
    const regional =
      'https://orderme-f0740-default-rtdb.asia-southeast1.firebasedatabase.app';
    const configured = process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL?.trim();
    if (!configured) return regional;
    if (configured.includes('firebaseio.com') && !configured.includes('asia-southeast1')) {
      return regional;
    }
    return configured;
  })(),
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

function createAuth() {
  if (Platform.OS === 'web') {
    return getAuth(firebaseApp);
  }
  try {
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    if (error?.code === 'auth/already-initialized') {
      return getAuth(firebaseApp);
    }
    throw error;
  }
}

export const auth = createAuth();
export const rtdb = getDatabase(firebaseApp);

/** Firestore instance — used for real-time chat messages. */
export const fs = getFirestore(firebaseApp);

export { firebaseConfig };
