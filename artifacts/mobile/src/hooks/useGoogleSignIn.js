import { useCallback, useState, useEffect, useRef } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { auth } from '../config/firebase';
import { getGoogleClientId, signInWithGoogleIdToken } from '../services/googleAuth';
import { getAuthErrorMessage } from '../utils/authErrors';
import { waitForFirebaseUser } from '../utils/waitForAuth';

WebBrowser.maybeCompleteAuthSession();

const redirectUri = makeRedirectUri({ scheme: 'orderme', path: 'redirect' });

export function useGoogleSignIn() {
  const [busy, setBusy] = useState(false);
  const handledRef = useRef(false);
  const clientId = getGoogleClientId();

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: clientId,
    iosClientId: clientId,
    androidClientId: clientId,
    expoClientId: clientId,
    redirectUri,
    selectAccount: true,
  });

  const completeWithResponse = useCallback(async (res) => {
    if (!res || res.type !== 'success') return false;

    const idToken = res.params?.id_token || res.authentication?.idToken;
    if (!idToken) {
      throw new Error('Google did not return a sign-in token. Add redirect URI in Google Cloud Console.');
    }

    await signInWithGoogleIdToken(idToken);
    return true;
  }, []);

  useEffect(() => {
    if (!response || response.type !== 'success' || handledRef.current) return;

    handledRef.current = true;
    setBusy(true);
    completeWithResponse(response)
      .catch((e) => console.warn('Google auth response:', e?.message))
      .finally(() => {
        setBusy(false);
        handledRef.current = false;
      });
  }, [response, completeWithResponse]);

  const signInWithGoogle = useCallback(async () => {
    if (!clientId) {
      throw new Error('Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env');
    }
    if (!request) {
      throw new Error('Google sign-in is still loading. Try again in a moment.');
    }

    handledRef.current = false;
    setBusy(true);

    try {
      const result = await promptAsync({ showInRecents: true });

      if (result?.type === 'success') {
        await completeWithResponse(result);
        return;
      }

      const user = await waitForFirebaseUser(3500);
      if (user) return;

      if (result?.type === 'cancel' || result?.type === 'dismiss') {
        throw new Error('Google sign-in was cancelled');
      }

      if (result?.type === 'error') {
        throw new Error(result.error?.message || 'Google sign-in failed');
      }

      throw new Error('Google sign-in did not complete. Add this redirect URI in Google Cloud: ' + redirectUri);
    } catch (error) {
      if (await waitForFirebaseUser(500)) return;
      throw new Error(getAuthErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }, [clientId, request, promptAsync, completeWithResponse]);

  return {
    signInWithGoogle,
    googleLoading: busy,
    googleReady: !!clientId && !!request,
  };
}
