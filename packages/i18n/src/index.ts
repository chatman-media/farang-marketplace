import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import translation resources
import enTranslations from './locales/en.js';
import ruTranslations from './locales/ru.js';
import thTranslations from './locales/th.js';
import cnTranslations from './locales/cn.js';
import arTranslations from './locales/ar.js';

// Supported languages
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  ru: 'Русский',
  th: 'ไทย',
  cn: '中文',
  ar: 'العربية',
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// Default language
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

// Language resources
const resources = {
  en: { translation: enTranslations },
  ru: { translation: ruTranslations },
  th: { translation: thTranslations },
  cn: { translation: cnTranslations },
  ar: { translation: arTranslations },
};

// Initialize i18next
i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    debug: process.env.NODE_ENV === 'development',

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'marketplace-language',
    },

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;

// Export hooks and utilities
export { useTranslation, Trans } from 'react-i18next';

// Language utilities
export const getCurrentLanguage = (): SupportedLanguage => {
  const current = i18n.language as SupportedLanguage;
  return Object.keys(SUPPORTED_LANGUAGES).includes(current)
    ? current
    : DEFAULT_LANGUAGE;
};

export const changeLanguage = async (
  language: SupportedLanguage
): Promise<void> => {
  await i18n.changeLanguage(language);
};

export const getLanguageDirection = (
  language?: SupportedLanguage
): 'ltr' | 'rtl' => {
  const lang = language || getCurrentLanguage();
  return lang === 'ar' ? 'rtl' : 'ltr';
};

// Translation function for use outside React components
export const t = (key: string, options?: any): string => {
  return i18n.t(key, options) as string;
};

// Namespace-specific translation functions
export const tAuth = (key: string, options?: any): string => {
  return i18n.t(`auth.${key}`, options) as string;
};

export const tCommon = (key: string, options?: any): string => {
  return i18n.t(`common.${key}`, options) as string;
};

export const tError = (key: string, options?: any): string => {
  return i18n.t(`errors.${key}`, options) as string;
};

export const tValidation = (key: string, options?: any): string => {
  return i18n.t(`validation.${key}`, options) as string;
};

// Format utilities
export const formatCurrency = (
  amount: number,
  currency: string = 'THB'
): string => {
  const language = getCurrentLanguage();
  const locale = {
    en: 'en-US',
    ru: 'ru-RU',
    th: 'th-TH',
    cn: 'zh-CN',
    ar: 'ar-SA',
  }[language];

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatDate = (date: Date | string): string => {
  const language = getCurrentLanguage();
  const locale = {
    en: 'en-US',
    ru: 'ru-RU',
    th: 'th-TH',
    cn: 'zh-CN',
    ar: 'ar-SA',
  }[language];

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};

export const formatTime = (date: Date | string): string => {
  const language = getCurrentLanguage();
  const locale = {
    en: 'en-US',
    ru: 'ru-RU',
    th: 'th-TH',
    cn: 'zh-CN',
    ar: 'ar-SA',
  }[language];

  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};
