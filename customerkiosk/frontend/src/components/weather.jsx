import { useEffect, useState } from "react";

export default function Weather() {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchWeather = async () => {
      try {

        // 30.6210° N, 96.3255° W college station
        // Houston coordinates
        const lat = 29.7604;
        const lon = -95.3698;

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

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
  }, []);

  if (error) return <p>Error: {error}</p>;
  if (!weather) return <p>Loading weather...</p>;

  // Convert Celsius → Fahrenheit
  const tempF = (weather.temperature * 9) / 5 + 32;

  return (
    <div style={{ padding: 10, width: 220, borderRadius: 12, background: "#e9e9e9" }}>
      <h3>Houston</h3>
      <p>🌡 Temp: {tempF.toFixed(1)}°F</p>
      <p>💨 Wind: {weather.windspeed} mph</p>
      <p>📍 Direction: {weather.winddirection}°</p>
      <p>⏱ Time: {weather.time}</p>
    </div>
  );
}
