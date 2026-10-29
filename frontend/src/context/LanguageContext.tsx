import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../locales/en.json';
import ta from '../locales/ta.json';
import hi from '../locales/hi.json';
import { Language } from '../types';

type TranslationKey = keyof typeof en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey | string, fallback?: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: en as Record<string, string>,
  ta: ta as Record<string, string>,
  hi: hi as Record<string, string>,
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('quickmend_language') as Language;
    return saved && ['en', 'ta', 'hi'].includes(saved) ? saved : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('quickmend_language', lang);
  };

  const t = (key: string, fallback?: string): string => {
    const currentDict = translations[language] || translations.en;
    if (currentDict[key]) {
      return currentDict[key];
    }
    if (translations.en[key]) {
      return translations.en[key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
