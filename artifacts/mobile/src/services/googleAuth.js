import { Platform } from 'react-native';
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';
import { auth } from '../config/firebase';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

export function getGoogleClientId() {
  return WEB_CLIENT_ID;
}

export async function processGoogleRedirectResult() {
  if (Platform.OS !== 'web') return null;
  try {
    return await getRedirectResult(auth);
  } catch (error) {
    console.warn('Google redirect result:', error?.message);
    return null;
  }
}

export async function signInWithGoogleFirebase() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  if (Platform.OS === 'web') {
    try {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      const code = error?.code || '';
      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request'
      ) {
        await signInWithRedirect(auth, provider);
        return null;
      }
      throw error;
    }
  }

  throw new Error('Use native Google hook on this platform');
}

export async function signInWithGoogleIdToken(idToken) {
  if (!idToken) throw new Error('Missing Google ID token');
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
}
