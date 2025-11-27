import { createContext, useContext, useState, useEffect } from "react";
import translationService from "../services/translationService";
import { translations as staticTranslations } from "../i18n/translations";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [language, setLanguage] = useState("en");
  const [translations, setTranslations] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);

  const addToCart = (item) => {
    setCart((prevCart) => [...prevCart, { ...item, id: Date.now() }]);
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleLanguage = () => {
    setLanguage((lang) => (lang === "en" ? "es" : "en"));
  };

  const normalizeText = (text) => {
    if (!text) return "";
    return String(text).trim().toLowerCase();
  };

  // Pre-load common translations when language changes
  useEffect(() => {
    if (language === "en") {
      setTranslations({});
      setIsTranslating(false);
      return;
    }

    const loadTranslations = async () => {
      setIsTranslating(true);

      try {
        // Fetch menu items
        const menuResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/api/menu`
        );
        const menuItems = await menuResponse.json();

        // Fetch customizations
        const customResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/api/customizations`
        );
        const customData = await customResponse.json();

        // Collect all text that needs translation. Include product names,
        // categories/types (so category tabs translate), toppings, sizes,
        // ice and sweetness options.
        const textsToTranslate = [
          ...menuItems.map((item) => item.name),
          ...menuItems
            .map((item) => item.category || item.type)
            .filter(Boolean),
          ...(customData.toppings || []).map((t) => t.name),
          ...customData.sizes,
          ...customData.iceOptions,
          ...customData.sweetnessOptions,
        ];

        console.log(
          `Translating ${textsToTranslate.length} items to ${language}...`
        );

        // Translate all texts. Start by seeding known static translations
        // from `src/i18n/translations.js` (this covers product names
        // that were added to the static map, e.g. "Strawberry Lemonade").
        // Store both the original key and a normalized key (trimmed +
        // lowercase) so lookups are resilient to casing/whitespace.
        const translatedPhrases = {};

        // Seed from static translations for the selected language
        const staticMap =
          (staticTranslations && staticTranslations[language]) || {};
        for (const [k, v] of Object.entries(staticMap)) {
          if (!k) continue;
          translatedPhrases[k] = v;
          translatedPhrases[normalizeText(k)] = v;
        }

        for (const text of textsToTranslate) {
          const key = text || "";
          if (!key || String(key).trim() === "") continue;

          // Skip API translation if we already have a static translation
          if (translatedPhrases[key] || translatedPhrases[normalizeText(key)]) {
            console.log(`Skipping API translate for "${key}" (static exists)`);
            continue;
          }

          try {
            const translated = await translationService.translate(
              key,
              language,
              "en"
            );
            translatedPhrases[key] = translated;
            translatedPhrases[normalizeText(key)] = translated;
            console.log(`Translated: "${key}" -> "${translated}"`);
          } catch (error) {
            console.error(`Failed to translate "${key}":`, error);
            translatedPhrases[key] = key;
            translatedPhrases[normalizeText(key)] = key;
          }
        }

        setTranslations(translatedPhrases);
        console.log(
          "All translations loaded:",
          Object.keys(translatedPhrases).length
        );
      } catch (error) {
        console.error("Error loading translations:", error);
      } finally {
        setIsTranslating(false);
      }
    };

    loadTranslations();
  }, [language]);

  // Translation function that uses API
  const translate = async (text) => {
    if (!text) return "";
    if (language === "en") return text;
    // Check if already translated (direct or normalized key)
    if (translations[text]) return translations[text];
    const n = normalizeText(text);
    if (n && translations[n]) return translations[n];

    // Translate on the fly
    try {
      const translated = await translationService.translate(
        text,
        language,
        "en"
      );
      // Cache it under both forms
      setTranslations((prev) => ({
        ...prev,
        [text]: translated,
        [n]: translated,
      }));
      return translated;
    } catch (error) {
      console.error("Translation error:", error);
      return text;
    }
  };

  // Synchronous translation (returns cached or original)
  const t = (text) => {
    if (!text) return "";
    if (language === "en") return text;
    if (translations[text]) return translations[text];
    const n = normalizeText(text);
    return n && translations[n] ? translations[n] : text;
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <AppContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        cartTotal,
        user,
        setUser,
        language,
        toggleLanguage,
        t,
        translate,
        isTranslating,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
