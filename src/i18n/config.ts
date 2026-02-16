import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Custom detector options for Supabase integration logic later if needed,
// but for now we stick to standard detection order + localStorage.
const detectionOptions = {
    order: ['localStorage', 'navigator'],
    caches: ['localStorage'],
    lookupLocalStorage: 'i18nextLng',
};

i18n
    // Load translations from /public/locales
    .use(Backend)
    // Detect user language
    .use(LanguageDetector)
    // Pass i18n instance to react-i18next
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        supportedLngs: ['en', 'fr'],
        load: 'languageOnly',
        nonExplicitSupportedLngs: true,
        
        // Language detection config
        detection: detectionOptions,

        // React integration config
        react: {
            useSuspense: true, // Recommended for React
        },

        // Debug mode (disable in production)
        debug: import.meta.env.DEV,
        
        // Interpolation config
        interpolation: {
            escapeValue: false, // React already safe from XSS
        },
        
        // Backend config (path to translation files)
        backend: {
            loadPath: `${import.meta.env.BASE_URL}locales/{{lng}}/translation.json`,
        }
    });

export default i18n;
