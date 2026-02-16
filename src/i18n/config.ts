import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import fr from './locales/fr.json';

// Custom detector options for Supabase integration logic later if needed,
// but for now we stick to standard detection order + localStorage.
const detectionOptions = {
    order: ['localStorage', 'navigator'],
    caches: ['localStorage'],
    lookupLocalStorage: 'i18nextLng',
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            fr: { translation: fr }
        },
        fallbackLng: 'en',
        supportedLngs: ['en', 'fr'],
        load: 'languageOnly',
        nonExplicitSupportedLngs: true,
        detection: detectionOptions,
        react: {
            useSuspense: true,
        },
        debug: import.meta.env.DEV,
        interpolation: {
            escapeValue: false,
        },
        returnNull: false,
        returnEmptyString: false
    });

export default i18n;
