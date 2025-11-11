// Translation service using MyMemory Translation API (free, no API key required)
// Alternative: LibreTranslate if you want to self-host

const TRANSLATION_API = 'https://api.mymemory.translated.net/get';
const CACHE_KEY = 'translation_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

class TranslationService {
  constructor() {
    this.cache = this.loadCache();
  }

  // Load cache from localStorage
  loadCache() {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        // Check if cache is expired
        if (Date.now() - data.timestamp < CACHE_EXPIRY) {
          return data.translations || {};
        }
      }
    } catch (error) {
      console.error('Error loading translation cache:', error);
    }
    return {};
  }

  // Save cache to localStorage
  saveCache() {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        translations: this.cache,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error saving translation cache:', error);
    }
  }

  // Generate cache key
  getCacheKey(text, sourceLang, targetLang) {
    return `${sourceLang}:${targetLang}:${text}`;
  }

  // Translate a single text
  async translate(text, targetLang = 'es', sourceLang = 'en') {
    // Don't translate if languages are the same
    if (sourceLang === targetLang) {
      return text;
    }

    // Check cache first
    const cacheKey = this.getCacheKey(text, sourceLang, targetLang);
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }

    try {
      const url = `${TRANSLATION_API}?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.responseStatus === 200 && data.responseData) {
        const translatedText = data.responseData.translatedText;

        // Cache the result
        this.cache[cacheKey] = translatedText;
        this.saveCache();

        return translatedText;
      } else {
        console.warn(`Translation failed for "${text}":`, data);
        return text; // Return original text if translation fails
      }
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text on error
    }
  }

  // Translate multiple texts in parallel
  async translateBatch(texts, targetLang = 'es', sourceLang = 'en') {
    const promises = texts.map(text => this.translate(text, targetLang, sourceLang));
    return await Promise.all(promises);
  }

  // Clear cache
  clearCache() {
    this.cache = {};
    localStorage.removeItem(CACHE_KEY);
  }
}

// Export singleton instance
export default new TranslationService();
