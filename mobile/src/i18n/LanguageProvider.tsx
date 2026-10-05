import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocales } from 'expo-localization';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { parseLanguagePreference, resolveLanguage, type Language, type LanguagePreference } from './language';
import { translations, type Copy } from './translations';

const STORAGE_KEY = 'trackly.language';

type LanguageContextValue = {
  language: Language;
  preference: LanguagePreference;
  copy: Copy;
  ready: boolean;
  storageError: 'load' | 'save' | null;
  setPreference: (preference: LanguagePreference) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const locales = useLocales();
  const [preference, setPreferenceState] = useState<LanguagePreference>('system');
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState<'load' | 'save' | null>(null);
  const saveQueue = useRef(Promise.resolve());
  const saveVersion = useRef(0);

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (active) setPreferenceState(parseLanguagePreference(value));
      })
      .catch(() => {
        if (active) setStorageError('load');
      })
      .finally(() => {
        if (active) setReady(true);
      });

    return () => { active = false; };
  }, []);

  function setPreference(next: LanguagePreference) {
    const version = ++saveVersion.current;
    setPreferenceState(next);
    setStorageError(null);
    saveQueue.current = saveQueue.current
      .then(() => AsyncStorage.setItem(STORAGE_KEY, next))
      .catch(() => {
        if (version === saveVersion.current) setStorageError('save');
      });
  }

  const language = resolveLanguage(preference, locales.map((locale) => locale.languageTag));

  return (
    <LanguageContext.Provider value={{
      language, preference, copy: translations[language], ready, storageError, setPreference,
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('LanguageProvider is missing');
  return context;
}
