import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import translationService from '../services/translationService';
import { useApp } from '../context/AppContext';

/**
 * Custom hook that combines static translations with API translations
 * - First tries to use static translations from i18n
 * - Falls back to API translation if not found
 * - Caches API results for performance
 */
export function useTranslate() {
  const { t, i18n } = useTranslation();
  const { language } = useApp();
  const [translatedCache, setTranslatedCache] = useState({});

  // Function to translate a single text
  const translate = async (text, options = {}) => {
    if (!text) return '';

    const targetLang = language;
    const defaultValue = options.defaultValue || text;

    // If English, return original
    if (targetLang === 'en') {
      return text;
    }

    // First, try static translation from i18n
    const staticTranslation = t(text, { defaultValue: null });
    if (staticTranslation && staticTranslation !== text) {
      return staticTranslation;
    }

    // Check if we've already translated this text
    const cacheKey = `${targetLang}:${text}`;
    if (translatedCache[cacheKey]) {
      return translatedCache[cacheKey];
    }

    // Use API translation
    try {
      const translated = await translationService.translate(text, targetLang, 'en');

      // Update cache
      setTranslatedCache(prev => ({
        ...prev,
        [cacheKey]: translated
      }));

      return translated;
    } catch (error) {
      console.error('Translation failed:', error);
      return defaultValue;
    }
  };

  // Synchronous version that returns the text immediately (for compatibility with current code)
  // Uses cached translations or returns original text
  const translateSync = (text, options = {}) => {
    if (!text) return '';

    const targetLang = language;
    const defaultValue = options.defaultValue || text;

    // If English, return original
    if (targetLang === 'en') {
      return text;
    }

    // First, try static translation from i18n
    const staticTranslation = t(text, { defaultValue: null });
    if (staticTranslation && staticTranslation !== text) {
      return staticTranslation;
    }

    // Check cache
    const cacheKey = `${targetLang}:${text}`;
    if (translatedCache[cacheKey]) {
      return translatedCache[cacheKey];
    }

    // Trigger async translation in background
    translate(text, options);

    // Return original text for now
    return defaultValue;
  };

  return {
    t: translateSync,  // Drop-in replacement for i18n's t()
    translate,         // Async version
    language,
    i18n
  };
}
