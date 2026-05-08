import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ar from './locales/ar.json';

const savedLang = localStorage.getItem('mirsad_lang') || 'en';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ar: { translation: ar } },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

// Set document direction on init
document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = savedLang;

export function setLanguage(lang: 'en' | 'ar') {
  i18n.changeLanguage(lang);
  localStorage.setItem('mirsad_lang', lang);
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
}

export default i18n;
