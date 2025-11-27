import { useState, useEffect, useCallback } from 'react';

export const useWeather = () => {
  const [weather, setWeather] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getWeatherCondition = useCallback((code) => {
    if (code === 0) return 'Clear';
    if (code <= 3) return 'Partly Cloudy';
    if (code <= 67) return 'Rainy';
    if (code <= 77) return 'Snowy';
    if (code <= 99) return 'Stormy';
    return 'Unknown';
  }, []);

  const getLocationAndWeather = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let latitude, longitude;

      // Try to get user's location from browser geolocation
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 15000, // Increased timeout to 15 seconds
            maximumAge: 300000,
            enableHighAccuracy: false // Faster, less accurate is fine for weather
          });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch (geoError) {
        // If geolocation fails, try IP-based location as fallback
        console.log('Geolocation failed, trying IP-based location...', geoError);
        try {
          // Use AbortController for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          const ipResponse = await fetch('https://ipapi.co/json/', {
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          if (!ipResponse.ok) throw new Error('IP location fetch failed');
          const ipData = await ipResponse.json();
          latitude = ipData.latitude;
          longitude = ipData.longitude;
        } catch (ipError) {
          // Last resort: use a default location (e.g., San Francisco)
          console.log('IP location failed, using default location...', ipError);
          latitude = 37.7749;
          longitude = -122.4194;
        }
      }

      setLocation({ latitude, longitude });

      // Fetch weather data from Open-Meteo API (free, no API key needed)
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`
      );
      
      if (!weatherResponse.ok) throw new Error('Weather fetch failed');
      
      const weatherData = await weatherResponse.json();
      const temp = weatherData.current.temperature_2m;
      const weatherCode = weatherData.current.weather_code;
      
      setWeather({
        temperature: temp,
        weatherCode: weatherCode,
        condition: getWeatherCondition(weatherCode)
      });
      
    } catch (err) {
      console.error('Location/Weather error:', err);
      setError(err.message || 'Unable to fetch weather data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [getWeatherCondition]);

  useEffect(() => {
    getLocationAndWeather();
  }, [getLocationAndWeather]);

  return { weather, location, loading, error };
};

export const getDrinkRecommendation = (temp, weatherCode) => {
  // Hot weather (>75°F)
  if (temp > 75) {
    return {
      name: 'Iced Passion Fruit Tea',
      reason: `It's ${temp}°F - perfect weather for something refreshing!`,
      size: 'Large',
      iceLevel: '100%',
      sweetnessLevel: '50%',
      toppings: ['Lychee Jelly'],
      emoji: '☀️'
    };
  }
  
  // Cold weather (<50°F)
  if (temp < 50) {
    return {
      name: 'Hot Milk Tea',
      reason: `It's only ${temp}°F - warm up with a hot drink!`,
      size: 'Medium',
      iceLevel: '0%',
      sweetnessLevel: '75%',
      toppings: ['Tapioca Pearls'],
      emoji: '❄️'
    };
  }

  // Rainy weather
  if (weatherCode >= 51 && weatherCode <= 67) {
    return {
      name: 'Hot Taro Milk Tea',
      reason: `Rainy day at ${temp}°F - cozy up with something warm!`,
      size: 'Medium',
      iceLevel: '0%',
      sweetnessLevel: '75%',
      toppings: ['Pudding'],
      emoji: '🌧️'
    };
  }

  // Snowy weather
  if (weatherCode >= 71 && weatherCode <= 77) {
    return {
      name: 'Hot Chocolate Milk Tea',
      reason: `Snowy weather at ${temp}°F - stay cozy!`,
      size: 'Medium',
      iceLevel: '0%',
      sweetnessLevel: '75%',
      toppings: ['Tapioca Pearls', 'Pudding'],
      emoji: '🌨️'
    };
  }

  // Moderate weather - default to popular choice
  return {
    name: 'Classic Milk Tea',
    reason: `Perfect ${temp}°F weather for our bestseller!`,
    size: 'Medium',
    iceLevel: '50%',
    sweetnessLevel: '50%',
    toppings: ['Tapioca Pearls'],
    emoji: '🌤️'
  };
};

// Simple Weather Component for MenuPage - shows temperature and recommended drink
export const WeatherWidget = ({ drinks, onDrinkClick }) => {
  const { weather, loading, error } = useWeather();
  const recommendedDrink = weather ? getDrinkRecommendation(weather.temperature, weather.weatherCode) : null;

  if (loading) {
    return (
      <div style={{ 
        padding: '10px', 
        background: '#f5f5f5', 
        borderRadius: '5px',
        fontSize: '14px'
      }}>
        Loading weather...
      </div>
    );
  }

  if (error || !weather || !recommendedDrink) {
    // Default recommendation when weather unavailable
    const defaultRecommendation = {
      name: 'Classic Milk Tea',
      emoji: '🌤️'
    };
    
    const handleClick = () => {
      if (drinks && onDrinkClick) {
        const normalizeName = (name) => name.toLowerCase().replace(/\s+/g, ' ').trim();
        // Try to find a milk tea drink
        let drink = drinks.find(d => {
          const drinkName = normalizeName(d.name);
          return drinkName.includes('milk tea') || drinkName.includes('classic');
        });
        // If no milk tea, just get the first drink
        if (!drink && drinks.length > 0) {
          drink = drinks[0];
        }
        if (drink) {
          const productId = drink.product_id || drink.item_id;
          onDrinkClick(productId);
        }
      }
    };

    return (
      <div 
        onClick={handleClick}
        style={{ 
          padding: '10px 15px', 
          background: '#e8e8e8', 
          borderRadius: '5px',
          cursor: 'pointer',
          border: '1px solid #ddd'
        }}
      >
        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
          {defaultRecommendation.emoji} Recommended: {defaultRecommendation.name}
        </div>
      </div>
    );
  }

  const handleClick = () => {
    if (drinks && onDrinkClick) {
      // Normalize names for better matching
      const normalizeName = (name) => name.toLowerCase().replace(/\s+/g, ' ').trim();
      const recommendedName = normalizeName(recommendedDrink.name);
      
      // Try to find the recommended drink by name (flexible matching)
      let drink = drinks.find(d => {
        const drinkName = normalizeName(d.name);
        // Check if names match or contain each other
        return drinkName.includes(recommendedName) || 
               recommendedName.includes(drinkName) ||
               // Try matching key words (e.g., "Passion Fruit" matches "Passionfruit")
               recommendedName.split(' ').some(word => word.length > 3 && drinkName.includes(word)) ||
               drinkName.split(' ').some(word => word.length > 3 && recommendedName.includes(word));
      });
      
      // If no match, try matching by keywords from recommendation
      if (!drink) {
        const keywords = recommendedName.split(' ').filter(w => w.length > 3);
        drink = drinks.find(d => {
          const drinkName = normalizeName(d.name);
          return keywords.some(keyword => drinkName.includes(keyword));
        });
      }
      
      // Last resort: find any milk tea
      if (!drink) {
        drink = drinks.find(d => normalizeName(d.name).includes('milk tea'));
      }
      
      if (drink) {
        const productId = drink.product_id || drink.item_id;
        onDrinkClick(productId);
      }
    }
  };

  return (
    <div 
      onClick={handleClick}
      style={{ 
        padding: '10px 15px', 
        background: '#e8e8e8', 
        borderRadius: '5px',
        cursor: 'pointer',
        border: '1px solid #ddd'
      }}
    >
      <div style={{ fontSize: '14px', marginBottom: '5px' }}>
        🌡️ {weather.temperature}°F
      </div>
      <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
        {recommendedDrink.emoji} {recommendedDrink.name}
      </div>
    </div>
  );
};

// Keep default export for backward compatibility (if used elsewhere)
const Weather = () => {
  return null; // Not used in App.jsx anymore
};

export default Weather;