import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

const localeModules = import.meta.glob("./*.json", { eager: true });

export const LANGUAGE_STORAGE_KEY = "inkverse_language";
export const SUPPORTED_LANGUAGES = [
  { code: "en", labelKey: "common.languages.en", nativeName: "English" },
  { code: "zh", labelKey: "common.languages.zh", nativeName: "中文" },
  { code: "hi", labelKey: "common.languages.hi", nativeName: "हिन्दी" },
  { code: "es", labelKey: "common.languages.es", nativeName: "Español" },
  { code: "fr", labelKey: "common.languages.fr", nativeName: "Français" },
  { code: "ar", labelKey: "common.languages.ar", nativeName: "العربية" },
  { code: "bn", labelKey: "common.languages.bn", nativeName: "বাংলা" },
  { code: "pt", labelKey: "common.languages.pt", nativeName: "Português" },
  { code: "ru", labelKey: "common.languages.ru", nativeName: "Русский" },
  { code: "ur", labelKey: "common.languages.ur", nativeName: "اردو" },
  { code: "id", labelKey: "common.languages.id", nativeName: "Bahasa Indonesia" },
  { code: "de", labelKey: "common.languages.de", nativeName: "Deutsch" },
  { code: "ja", labelKey: "common.languages.ja", nativeName: "日本語" },
  { code: "tr", labelKey: "common.languages.tr", nativeName: "Türkçe" },
  { code: "ko", labelKey: "common.languages.ko", nativeName: "한국어" },
  { code: "vi", labelKey: "common.languages.vi", nativeName: "Tiếng Việt" },
  { code: "it", labelKey: "common.languages.it", nativeName: "Italiano" },
  { code: "fa", labelKey: "common.languages.fa", nativeName: "فارسی" },
  { code: "pl", labelKey: "common.languages.pl", nativeName: "Polski" },
  { code: "nl", labelKey: "common.languages.nl", nativeName: "Nederlands" },
  { code: "th", labelKey: "common.languages.th", nativeName: "ไทย" },
  { code: "ms", labelKey: "common.languages.ms", nativeName: "Bahasa Melayu" },
  { code: "ta", labelKey: "common.languages.ta", nativeName: "தமிழ்" },
  { code: "te", labelKey: "common.languages.te", nativeName: "తెలుగు" },
];
export const SUPPORTED_LANGUAGE_CODES = SUPPORTED_LANGUAGES.map(
  (language) => language.code,
);
const RTL_LANGUAGE_CODES = new Set(["ar", "fa", "ur"]);

const resources = SUPPORTED_LANGUAGE_CODES.reduce((acc, code) => {
  const localeModule = localeModules[`./${code}.json`];

  if (localeModule) {
    acc[code] = {
      translation: localeModule.default ?? localeModule,
    };
  }

  return acc;
}, {});

export function normalizeLanguageCode(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .split("-")[0];

  return SUPPORTED_LANGUAGE_CODES.includes(normalized) ? normalized : "en";
}

export function getLanguageOptions(t) {
  return SUPPORTED_LANGUAGES.map((language) => ({
    value: language.code,
    label: t(language.labelKey, { defaultValue: language.nativeName }),
    shortLabel: language.code.toUpperCase(),
    nativeName: language.nativeName,
  }));
}

export function setAppLanguage(value) {
  const nextLanguage = normalizeLanguageCode(value);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    } catch {
      // Language changes should still work when storage is blocked.
    }
  }
  void i18n.changeLanguage(nextLanguage);
  return nextLanguage;
}

function applyDocumentLanguage(value) {
  if (typeof document === "undefined") return;

  const language = normalizeLanguageCode(value);
  document.documentElement.lang = language;
  document.documentElement.dir = RTL_LANGUAGE_CODES.has(language) ? "rtl" : "ltr";
}

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: "en",
      supportedLngs: SUPPORTED_LANGUAGE_CODES,
      load: "languageOnly",
      nonExplicitSupportedLngs: true,
      detection: {
        order: ["localStorage", "htmlTag", "navigator"],
        lookupLocalStorage: LANGUAGE_STORAGE_KEY,
        caches: ["localStorage"],
      },
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
      returnNull: false,
    })
    .then(() => {
      applyDocumentLanguage(i18n.language);
    });

  i18n.on("languageChanged", applyDocumentLanguage);
}

export default i18n;
