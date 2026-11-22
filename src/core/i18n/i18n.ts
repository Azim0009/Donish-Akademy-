import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ru from './locales/ru.json';
import en from './locales/en.json';
import tg from './locales/tg.json';

/** ru — русский, tg — таджикский (на кнопке «TJ»), en — английский */
export const LANGUAGES = ['ru', 'tg', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];

/** Подпись на переключателе */
export const LANGUAGE_LABEL: Record<Language, string> = { ru: 'RU', tg: 'TJ', en: 'EN' };
/** Полное название (в настройках) */
export const LANGUAGE_NAME: Record<Language, string> = {
  ru: 'Русский',
  tg: 'Тоҷикӣ',
  en: 'English',
};

const LANG_KEY = 'donish-lang';

function getSavedLanguage(): Language {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if ((LANGUAGES as readonly string[]).includes(saved ?? '')) return saved as Language;
  } catch {
    /* localStorage может быть недоступен */
  }
  return 'ru';
}

i18n.use(initReactI18next).init({
  resources: { ru: { translation: ru }, tg: { translation: tg }, en: { translation: en } },
  lng: getSavedLanguage(),
  fallbackLng: 'ru',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(LANG_KEY, lng);
  } catch {
    /* ignore */
  }
  document.documentElement.lang = lng;
});
document.documentElement.lang = i18n.language;

export default i18n;
