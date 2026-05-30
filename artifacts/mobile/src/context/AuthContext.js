import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { getAuthErrorMessage } from '../utils/authErrors';
import { PATHS, dbSet, dbListen, dbGet } from '../services/rtdb';
import { DEFAULT_NOTIFICATIONS } from '../data/seedCatalog';
import { arrayToMap } from '../services/rtdb';
import { processGoogleRedirectResult } from '../services/googleAuth';

const AuthContext = createContext(null);

const DEFAULT_AVATAR = 'https://randomuser.me/api/portraits/men/10.jpg';

function buildAppUser(firebaseUser, profile = {}) {
  if (!firebaseUser) return null;
  return {
    id: firebaseUser.uid,
    name: profile.name || firebaseUser.displayName || 'OrderMe User',
    email: firebaseUser.email || profile.email || '',
    phone: profile.phone || '',
    avatar: profile.avatar || firebaseUser.photoURL || DEFAULT_AVATAR,
    address: profile.address || '',
    city: profile.city || '',
    language: profile.language || 'en',
    theme: profile.theme === 'dark' ? 'dark' : 'light',
    notificationsEnabled: profile.notificationsEnabled !== false,
    locationEnabled: profile.locationEnabled !== false,
    isLoggedIn: true,
    savedAddresses: profile.savedAddresses || [],
    assistantName: profile.assistantName || '',
    avatarVersion: profile.avatarVersion || profile.updatedAt || '',
  };
}

function profileRecordFromAppUser(appUser) {
  if (!appUser?.id) return {};
  return {
    name: appUser.name,
    email: appUser.email,
    phone: appUser.phone,
    avatar: appUser.avatar,
    address: appUser.address,
    city: appUser.city,
    language: appUser.language,
    theme: appUser.theme,
    notificationsEnabled: appUser.notificationsEnabled,
    locationEnabled: appUser.locationEnabled,
    savedAddresses: appUser.savedAddresses,
    assistantName: appUser.assistantName,
    avatarVersion: appUser.avatarVersion,
    updatedAt: appUser.updatedAt,
  };
}

function syncProfileToCloud(uid, merged, updates) {
  dbSet(PATHS.userProfile(uid), merged).catch((e) => {
    console.warn('updateProfile cloud:', e?.message);
  });

  const firebaseUser = auth.currentUser;
  if (!firebaseUser || firebaseUser.uid !== uid) return;

  const authUpdates = {};
  if (updates.name) authUpdates.displayName = updates.name;
  if (updates.avatar) authUpdates.photoURL = updates.avatar;
  if (!Object.keys(authUpdates).length) return;

  updateProfile(firebaseUser, authUpdates).catch((e) => {
    console.warn('updateProfile auth:', e?.message);
  });
}

async function ensureUserRecords(firebaseUser) {
  const existing = await dbGet(PATHS.userProfile(firebaseUser.uid));
  if (existing) return;

  const profile = {
    name: firebaseUser.displayName || 'OrderMe User',
    email: firebaseUser.email || '',
    phone: '',
    avatar: firebaseUser.photoURL || DEFAULT_AVATAR,
    address: '',
    city: '',
    language: 'en',
    theme: 'light',
    notificationsEnabled: true,
    locationEnabled: true,
    savedAddresses: [],
    createdAt: new Date().toISOString(),
    authProvider: firebaseUser.providerData?.[0]?.providerId || 'password',
  };

  await dbSet(PATHS.userProfile(firebaseUser.uid), profile);
  const notifs = await dbGet(PATHS.userNotifications(firebaseUser.uid));
  if (!notifs) {
    await dbSet(PATHS.userNotifications(firebaseUser.uid), arrayToMap(DEFAULT_NOTIFICATIONS));
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authInitializing, setAuthInitializing] = useState(true);
  const userRef = useRef(null);
  const profileWriteLockUntil = useRef(0);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    let profileUnsub = null;
    const initTimer = setTimeout(() => setAuthInitializing(false), 3000);

    processGoogleRedirectResult().catch(() => {});

    const authUnsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }

      setAuthInitializing(false);
      clearTimeout(initTimer);

      if (!firebaseUser) {
        setUser(null);
        return;
      }

      const uid = firebaseUser.uid;

      setUser(buildAppUser(firebaseUser, {}));

      ensureUserRecords(firebaseUser).catch((e) => {
        console.warn('ensureUserRecords:', e?.message);
      });

      profileUnsub = dbListen(PATHS.userProfile(uid), (profile) => {
        if (Date.now() < profileWriteLockUntil.current) return;
        setUser(buildAppUser(firebaseUser, profile || {}));
      });
    });

    return () => {
      clearTimeout(initTimer);
      authUnsub();
      if (profileUnsub) profileUnsub();
    };
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name, email, phone, password) => {
    setIsLoading(true);
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      await updateProfile(firebaseUser, { displayName: name.trim() });

      const profile = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: '',
        city: '',
        avatar: DEFAULT_AVATAR,
        language: 'en',
        theme: 'light',
        notificationsEnabled: true,
        locationEnabled: true,
        savedAddresses: [],
        createdAt: new Date().toISOString(),
        authProvider: 'password',
      };

      try {
        await dbSet(PATHS.userProfile(firebaseUser.uid), profile);
        await dbSet(PATHS.userNotifications(firebaseUser.uid), arrayToMap(DEFAULT_NOTIFICATIONS));
      } catch (dbError) {
        console.warn('register profile save:', dbError?.message);
      }
    } catch (error) {
      if (auth.currentUser) return;
      throw new Error(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const updateProfileData = async (updates) => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error('Not signed in');
    const uid = firebaseUser.uid;
    const stamp = new Date().toISOString();

    profileWriteLockUntil.current = Date.now() + 2500;

    const fromApp = profileRecordFromAppUser(userRef.current?.id === uid ? userRef.current : null);
    const remote = (await dbGet(PATHS.userProfile(uid))) || {};

    const merged = {
      ...remote,
      ...fromApp,
      email: fromApp.email || remote.email || firebaseUser.email || '',
      ...updates,
      updatedAt: stamp,
      ...(updates.avatar ? { avatarVersion: stamp } : {}),
    };

    const nextUser = buildAppUser(firebaseUser, merged);
    setUser(nextUser);
    userRef.current = nextUser;

    syncProfileToCloud(uid, merged, updates);

    return merged;
  };

  const isLoggedIn = Boolean(user?.isLoggedIn || auth.currentUser);

  return (
    <AuthContext.Provider
      value={{
        user: isLoggedIn ? (user || buildAppUser(auth.currentUser, {})) : null,
        login,
        register,
        logout,
        updateProfile: updateProfileData,
        isLoading,
        authInitializing,
        isLoggedIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
