import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TRANSLATIONS, LANGUAGE_LABELS } from '../i18n/translations';
import { useAuth } from './AuthContext';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const { user, updateProfile } = useAuth();
  const [language, setLanguageState] = useState('ne');

  useEffect(() => {
    if (user?.language === 'en' || user?.language === 'ne') {
      setLanguageState(user.language);
    } else if (!user?.language) {
      // Default to Nepali as requested
      setLanguageState('ne');
    }
  }, [user?.language]);

  const setLanguage = useCallback(
    async (lang) => {
      if (lang !== 'en' && lang !== 'ne') return;
      setLanguageState(lang);
      if (user?.id) {
        await updateProfile({ language: lang });
      }
    },
    [user?.id, updateProfile],
  );

  const t = useCallback(
    (key) => TRANSLATIONS[language]?.[key] ?? TRANSLATIONS.en[key] ?? key,
    [language],
  );

  const languageLabel = LANGUAGE_LABELS[language] ?? 'English';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languageLabel, ready: true }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
