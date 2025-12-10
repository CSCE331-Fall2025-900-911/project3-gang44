import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApp } from "../context/AppContext";
import { WeatherWidget } from "../components/weather";
import { getDrinkImage } from "../config/drinkImages";

export default function MenuPage() {
  const [drinks, setDrinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All"); // NEW
  const [searchQuery, setSearchQuery] = useState(""); // Search state
  const navigate = useNavigate();
  const { t: i18nT } = useTranslation(); // For UI labels from i18n
  const { cart, t, isTranslating } = useApp(); // For API translations of database items

  const handleWeatherDrinkClick = (productId) => {
    navigate(`/customize/${productId}`);
  };

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL;
    console.log(
      "Fetching menu from:",
      apiUrl ? `${apiUrl}/api/menu` : "VITE_API_URL not set!"
    );

    if (!apiUrl) {
      console.error(
        "VITE_API_URL is not set! Please check your .env file and restart the dev server."
      );
      alert(
        "Configuration error: VITE_API_URL is not set. Please check your .env file and restart the dev server."
      );
      setLoading(false);
      return;
    }

    fetch(`${apiUrl}/api/menu`)
      .then((res) => {
        console.log("Response status:", res.status, res.statusText);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Menu data received:", data);
        if (Array.isArray(data)) {
          setDrinks(data);
        } else {
          console.error("Menu data is not an array:", data);
          setDrinks([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching menu:", err);
        console.error("API URL was:", apiUrl);
        alert(
          `Failed to load menu: ${err.message}. Check console for details.`
        );
        setDrinks([]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="loading">{i18nT("Loading menu...")}</div>;
  }

  if (isTranslating) {
    return <div className="loading">{i18nT("Loading translations...")}</div>;
  }

  if (drinks.length === 0) {
    return <div className="loading">{i18nT("No drinks available")}</div>;
  }

  // --- Build list of categories from the data ---
  // This assumes each drink has drink.category or drink.type.
  // If not, they fall into "Other".
  const categories = Array.from(
    new Set(drinks.map((drink) => drink.category || drink.type || "Other"))
  );

  // Figure out which drinks to show based on selected category and search query
  const drinksToShow = drinks.filter((drink) => {
    // Filter by category
    const matchesCategory =
      activeCategory === "All" ||
      (drink.category || drink.type || "Other") === activeCategory;

    // Filter by search query (case-insensitive, matches drink name)
    const matchesSearch = searchQuery.trim() === "" || 
      t(drink.name).toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      drink.name.toLowerCase().includes(searchQuery.toLowerCase().trim());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="menu-page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            flex: "0 0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            alignItems: "flex-start",
          }}
        >
          <button
            style={{
              padding: "10px 20px",
              fontSize: "1rem",
              cursor: "pointer",
              backgroundColor: "#fff",
              border: "2px solid #333",
              borderRadius: "4px",
              whiteSpace: "nowrap",
            }}
            onClick={() => navigate("/")}
          >
            ← {i18nT("Back to Landing Page")}
          </button>
          <WeatherWidget
            drinks={drinks}
            onDrinkClick={handleWeatherDrinkClick}
          />
        </div>
        <div className="menu-header" style={{ flex: "1", textAlign: "center" }}>
          <h1>{i18nT("menu")}</h1>
        </div>
        <div style={{ flex: "0 0 auto", width: "200px" }}></div>
      </div>

      {/* Search Bar */}
      <div style={{
        marginBottom: "20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}>
        <input
          type="text"
          placeholder={i18nT("Search drinks...") || "Search drinks..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "500px",
            padding: "12px 20px",
            fontSize: "1.125rem",
            border: "2px solid #333",
            borderRadius: "8px",
            outline: "none",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            style={{
              marginLeft: "10px",
              padding: "12px 20px",
              fontSize: "1rem",
              cursor: "pointer",
              backgroundColor: "#f0f0f0",
              border: "2px solid #333",
              borderRadius: "8px"
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Show search results count */}
      {searchQuery && (
        <div style={{
          textAlign: "center",
          marginBottom: "15px",
          fontSize: "1rem",
          color: "#666"
        }}>
          {drinksToShow.length === 0 
            ? i18nT("No drinks found") || "No drinks found"
            : `${drinksToShow.length} ${i18nT("drink(s) found") || "drink(s) found"}`
          }
        </div>
      )}

      {/* Category tabs */}
      <div className="category-tabs">
        <button
          className={`category-tab ${activeCategory === "All" ? "active" : ""}`}
          onClick={() => setActiveCategory("All")}
        >
          {i18nT("All")}
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`category-tab ${activeCategory === cat ? "active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {t(cat)}
          </button>
        ))}
      </div>

      {/* Grid of drinks for the selected category */}
      <div className="drink-grid">
        {drinksToShow.map((drink) => {
          const productId = drink.product_id || drink.item_id;
          const translatedName = t(drink.name); // API translation
          const imageUrl = getDrinkImage(drink.name);

          return (
            <div
              key={productId}
              className="drink-card"
              onClick={() => navigate(`/customize/${productId}`)}
            >
              {imageUrl && (
                <div className="drink-image-container">
                  <img
                    src={imageUrl}
                    alt={translatedName}
                    className="drink-image"
                    onError={(e) => {
                      // Hide image if it fails to load
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              )}
              <h3>{translatedName}</h3>
              <p>${parseFloat(drink.price).toFixed(2)}</p>
            </div>
          );
        })}
      </div>

      {cart.length > 0 && (
        <button className="cart-button" onClick={() => navigate("/cart")}>
          {i18nT("cart")} ({cart.length})
        </button>
      )}
    </div>
  );
}
