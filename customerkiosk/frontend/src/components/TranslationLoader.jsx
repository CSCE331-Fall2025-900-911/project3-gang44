import { useEffect } from 'react';
import { useApp } from '../context/AppContext';

/**
 * Component that pre-loads translations for menu items and ingredients
 * when the language changes
 */
export default function TranslationLoader() {
  const { language, translate } = useApp();

  // Pre-translate everything when language changes
  useEffect(() => {
    if (language === 'en') return;

    const preloadAllTranslations = async () => {
      console.log('Starting translation preload for language:', language);

      try {
        // Fetch and translate menu items
        const menuResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/menu`);
        const menuItems = await menuResponse.json();

        console.log('Fetched menu items:', menuItems.length);

        // Translate all menu item names
        const menuPromises = menuItems.map(item => {
          console.log('Translating menu item:', item.name);
          return translate(item.name);
        });
        await Promise.all(menuPromises);

        // Fetch and translate customizations
        const customResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/customizations`);
        const customData = await customResponse.json();

        console.log('Fetched toppings:', customData.toppings?.length || 0);

        // Translate all topping names
        if (customData.toppings) {
          const toppingPromises = customData.toppings.map(topping => {
            console.log('Translating topping:', topping.name);
            return translate(topping.name);
          });
          await Promise.all(toppingPromises);
        }

        // Also translate size, ice, and sweetness options
        const allOptions = [
          ...customData.sizes,
          ...customData.iceOptions,
          ...customData.sweetnessOptions
        ];

        const optionPromises = allOptions.map(option => translate(option));
        await Promise.all(optionPromises);

        console.log('Completed translation preload');
      } catch (error) {
        console.error('Error preloading translations:', error);
      }
    };

    preloadAllTranslations();
  }, [language, translate]);

  // This component doesn't render anything
  return null;
}
