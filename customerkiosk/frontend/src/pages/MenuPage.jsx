import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApp } from "../context/AppContext";

export default function MenuPage() {
  const [drinks, setDrinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All"); // NEW
  const navigate = useNavigate();
  const { t: i18nT } = useTranslation(); // For UI labels from i18n
  const { cart, t, isTranslating } = useApp(); // For API translations of database items

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL;
    console.log("Fetching menu from:", apiUrl ? `${apiUrl}/api/menu` : 'VITE_API_URL not set!');
    
    if (!apiUrl) {
      console.error("VITE_API_URL is not set! Please check your .env file and restart the dev server.");
      alert("Configuration error: VITE_API_URL is not set. Please check your .env file and restart the dev server.");
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
        alert(`Failed to load menu: ${err.message}. Check console for details.`);
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

  // Figure out which drinks to show based on selected category
  const drinksToShow =
    activeCategory === "All"
      ? drinks
      : drinks.filter(
          (drink) =>
            (drink.category || drink.type || "Other") === activeCategory
        );

  return (
    <div className="menu-page">
      <div className="menu-header">
        <h1>{i18nT("menu")}</h1>
        <div className="mode-buttons">
          <button
            className="cashier-mode-button"
            onClick={() => navigate("/cashier")}
          >
            {i18nT("Cashier Mode")}
          </button>
          <button
            className="manager-mode-button"
            onClick={() => navigate("/manager")}
          >
            {i18nT("Manager Mode")}
          </button>
        </div>
      </div>

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

          return (
            <div
              key={productId}
              className="drink-card"
              onClick={() => navigate(`/customize/${productId}`)}
            >
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
