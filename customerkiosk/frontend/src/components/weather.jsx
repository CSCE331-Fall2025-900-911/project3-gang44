import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../context/AppContext";

// Helper function to get boba recommendation based on weather
export const getBobaRecommendation = (temp, weatherCode, t) => {
  // Temperature in Fahrenheit
  if (temp >= 80) {
    return {
      drink: "Mango Green Tea",
      reason: `It's ${Math.round(temp)}°F! ${t(
        "Perfect weather for a refreshing fruit tea"
      )}`,
      emoji: "☀️",
    };
  } else if (temp >= 65) {
    return {
      drink: "Honey Milk Tea",
      reason: `Nice ${Math.round(temp)}°F ${t(
        "Nice weather calls for a sweet and smooth classic"
      )}`,
      emoji: "🌤️",
    };
  } else if (temp >= 50) {
    return {
      drink: "Brown Sugar Milk Tea",
      reason: `At ${Math.round(temp)}°F, ${t(
        "Enjoy something warm and comforting"
      )}`,
      emoji: "🍂",
    };
  } else if (weatherCode >= 71 && weatherCode <= 77) {
    return {
      drink: "Hot Taro Milk Tea",
      reason: t("It's snowing! Warm up with a cozy hot drink"),
      emoji: "❄️",
    };
  } else if (weatherCode >= 51 && weatherCode <= 67) {
    return {
      drink: "Jasmine Milk Tea",
      reason: t("Rainy day? A soothing tea is just what you need"),
      emoji: "🌧️",
    };
  } else {
    return {
      drink: "Thai Milk Tea",
      reason: `At ${Math.round(temp)}°F, ${t(
        "Treat yourself to something special"
      )}`,
      emoji: "✨",
    };
  }
};

// Hook to fetch weather and get recommendation
export const useWeatherRecommendation = () => {
  const { t } = useApp();
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeatherRecommendation = async () => {
      try {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;

              const weatherResponse = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`
              );
              const weatherData = await weatherResponse.json();

              const temp = weatherData.current.temperature_2m;
              const weatherCode = weatherData.current.weather_code;

              const rec = getBobaRecommendation(temp, weatherCode, t);
              setRecommendation(rec);
              setLoading(false);
            },
            (err) => {
              console.error("Location error:", err);
              // Default recommendation if location unavailable
              setRecommendation({
                drink: t("Classic Milk Tea"),
                reason: t("A timeless favorite for any occasion"),
                emoji: "🥤",
              });
              setLoading(false);
            }
          );
        } else {
          setRecommendation({
            drink: t("Classic Milk Tea"),
            reason: t("A timeless favorite for any occasion"),
            emoji: "🥤",
          });
          setLoading(false);
        }
      } catch (err) {
        console.error("Weather fetch error:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchWeatherRecommendation();
  }, [t]);

  return { recommendation, loading, error };
};

// Original Weather Display Component
export default function Weather() {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");
  const [location, setLocation] = useState(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setLocation({ lat, lon });
        },
        (err) => {
          setError("Unable to get location. Please enable location access.");
          console.error(err);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser");
    }
  }, []);

  useEffect(() => {
    if (!location) return;

    const fetchWeather = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current_weather=true`;

        const res = await fetch(url);
        const data = await res.json();

        if (!data.current_weather) {
          setError("Weather data not available");
          return;
        }

        setWeather(data.current_weather);
      } catch (err) {
        setError("Failed to fetch weather");
      }
    };

    fetchWeather();
  }, [location]);

  if (error) return <p style={{ padding: 10 }}>Error: {error}</p>;
  if (!weather) return <p style={{ padding: 10 }}>Loading weather...</p>;

  const tempF = (weather.temperature * 9) / 5 + 32;

  return (
    <div
      style={{
        padding: 10,
        width: 220,
        borderRadius: 12,
        background: "#e9e9e9",
      }}
    >
      <h3>Your Location</h3>
      <p>🌡 Temp: {tempF.toFixed(1)}°F</p>
      <p>💨 Wind: {weather.windspeed} mph</p>
      <p>📍 Direction: {weather.winddirection}°</p>
      <p>⏱ Time: {weather.time}</p>
    </div>
  );
}
