import { createContext, useContext, useState, useEffect } from 'react';
import translationService from '../services/translationService';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [language, setLanguage] = useState('en');
  const [translations, setTranslations] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);

  const addToCart = (item) => {
    setCart(prevCart => [...prevCart, { ...item, id: Date.now() }]);
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleLanguage = () => {
    setLanguage(lang => lang === 'en' ? 'es' : 'en');
  };

  // Pre-load common translations when language changes
  useEffect(() => {
    if (language === 'en') {
      setTranslations({});
      setIsTranslating(false);
      return;
    }

    const loadTranslations = async () => {
      setIsTranslating(true);

      try {
        // Fetch menu items
        const menuResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/menu`);
        const menuItems = await menuResponse.json();

        // Fetch customizations
        const customResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/customizations`);
        const customData = await customResponse.json();

        // Collect all text that needs translation
        const textsToTranslate = [
          ...menuItems.map(item => item.name),
          ...(customData.toppings || []).map(t => t.name),
          ...customData.sizes,
          ...customData.iceOptions,
          ...customData.sweetnessOptions
        ];

        console.log(`Translating ${textsToTranslate.length} items to ${language}...`);

        // Translate all texts
        const translatedPhrases = {};
        for (const text of textsToTranslate) {
          try {
            const translated = await translationService.translate(text, language, 'en');
            translatedPhrases[text] = translated;
            console.log(`Translated: "${text}" -> "${translated}"`);
          } catch (error) {
            console.error(`Failed to translate "${text}":`, error);
            translatedPhrases[text] = text;
          }
        }

        setTranslations(translatedPhrases);
        console.log('All translations loaded:', Object.keys(translatedPhrases).length);
      } catch (error) {
        console.error('Error loading translations:', error);
      } finally {
        setIsTranslating(false);
      }
    };

    loadTranslations();
  }, [language]);

  // Translation function that uses API
  const translate = async (text) => {
    if (!text) return '';
    if (language === 'en') return text;

    // Check if already translated
    if (translations[text]) {
      return translations[text];
    }

    // Translate on the fly
    try {
      const translated = await translationService.translate(text, language, 'en');
      // Cache it
      setTranslations(prev => ({ ...prev, [text]: translated }));
      return translated;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  };

  // Synchronous translation (returns cached or original)
  const t = (text) => {
    if (!text) return '';
    if (language === 'en') return text;
    return translations[text] || text;
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <AppContext.Provider value={{
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
      isTranslating
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);