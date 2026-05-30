import { useCallback, useState } from 'react';
import { auth } from '../config/firebase';
import { getAuthErrorMessage } from '../utils/authErrors';
import { signInWithGoogleFirebase } from '../services/googleAuth';
import { waitForFirebaseUser } from '../utils/waitForAuth';

export function useGoogleSignIn() {
  const [busy, setBusy] = useState(false);

  const signInWithGoogle = useCallback(async () => {
    setBusy(true);
    try {
      const user = await signInWithGoogleFirebase();
      if (user || auth.currentUser) return;

      const afterWait = await waitForFirebaseUser(4000);
      if (afterWait) return;
    } catch (error) {
      const code = error?.code || '';
      if (auth.currentUser) return;
      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request'
      ) {
        const user = await waitForFirebaseUser(2000);
        if (user) return;
        throw new Error('Google sign-in was cancelled');
      }
      throw new Error(getAuthErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }, []);

  return {
    signInWithGoogle,
    googleLoading: busy,
    googleReady: true,
  };
}
