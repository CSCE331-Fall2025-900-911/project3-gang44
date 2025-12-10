/**
 * Drink Images Configuration
 *
 * This file maps drink names to their image filenames.
 * All images should be stored in: /public/images/drinks/
 *
 * HOW TO ADD A NEW DRINK IMAGE:
 * 1. Save your image to: customerkiosk/frontend/public/images/drinks/
 * 2. Use a simple filename like: milk-tea.jpg, taro-tea.jpg, etc.
 * 3. Add an entry below with the exact drink name from your database
 * 4. The image will automatically appear on the menu!
 *
 * SUPPORTED IMAGE FORMATS: .jpg, .jpeg, .png, .webp, .gif
 */

const drinkImages = {
  // All drink names must match the database EXACTLY (including spaces and capitalization)
  "Black Tea Latte": "blacktealatte.jpg",
  "Brown Sugar Milk Tea": "brownsugarmilktea.jpg",
  "Classic Milk Tea": "classicmilktea.jpg",
  "Coffee Milk Tea": "coffeemilktea.jpg",
  "Honey Green Tea": "honeygreentea.jpg",
  "Hot Milk Tea": "hotmilktea.jpg",
  "Lychee Slush": "lycheeslush.jpg",
  "Mango Milk Slush": "mangomilkslush.jpg",
  "Mango Milk Tea": "mangomilktea.jpg",
  "Matcha Tea Latte": "matchatealatte.jpg",
  "Milk Foam Green Tea": "milkfoamgreentea.jpg",
  "Milk Foam Oolong Tea": "milkfoamoolongtea.jpg",
  "Passionfruit Green Tea": "passionfruitgreentea.jpg",
  "Strawberry Lemonade": "strawberrylemonade.jpg",
  "Taro Milk Slush": "taromilkslush.jpg",
  "Taro Milk Tea": "taromilktea.jpg",
  "Thai Tea Latte": "thaitealatte.jpg",
  "Wintermelon Milk Tea": "wintermelonmilktea.jpg",
  "Yummy Turkey": "yummyturkey.jpg",
  "Yummy Pumpkin": "yummypumpkin.jpg"
};

/**
 * Get the image URL for a drink
 * @param {string} drinkName - The name of the drink (must match database exactly)
 * @returns {string|null} The image URL or null if no image is configured
 */
export const getDrinkImage = (drinkName) => {
  const filename = drinkImages[drinkName];
  if (!filename) {
    return null;
  }
  return `/images/drinks/${filename}`;
};

/**
 * Check if a drink has an image
 * @param {string} drinkName - The name of the drink
 * @returns {boolean} True if the drink has an image configured
 */
export const hasDrinkImage = (drinkName) => {
  return drinkImages.hasOwnProperty(drinkName);
};

/**
 * Get a placeholder image URL for drinks without images
 * @returns {string} The placeholder image URL
 */
export const getPlaceholderImage = () => {
  return '/images/drinks/placeholder.jpg';
};

export default drinkImages;
