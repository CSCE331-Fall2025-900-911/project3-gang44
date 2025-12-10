import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApp } from "../context/AppContext";
import { useWeather, getDrinkRecommendation, findRecommendedDrinkId } from "../components/weather";

export default function CartPage() {
  const navigate = useNavigate();
  const { t: i18nT } = useTranslation();
  const {
    cart,
    removeFromCart,
    updateCartItemQuantity,
    cartTotal,
    clearCart,
    user,
    t,
  } = useApp();

  const [drinks, setDrinks] = useState([]);

  const handleEditItem = (item) => {
    // Navigate to customize page with edit mode
    navigate(`/customize/${item.menuItemId}?edit=${item.id}`);
  };
  const { weather, loading } = useWeather();
  const recommendation = weather
    ? getDrinkRecommendation(weather.temperature, weather.weatherCode)
    : null;

  // Fetch drinks list for recommendation matching
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) return;

    fetch(`${apiUrl}/api/menu`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDrinks(data);
        }
      })
      .catch((err) => {
        console.error("Error fetching menu for recommendations:", err);
      });
  }, []);

  const handleRecommendationClick = () => {
    if (recommendation && drinks.length > 0) {
      const productId = findRecommendedDrinkId(drinks, recommendation.name);
      if (productId) {
        navigate(`/customize/${productId}`);
      } else {
        // Fallback to menu if we can't find the drink
        navigate("/menu");
      }
    }
  };

  const handleProceedToCheckout = () => {
    navigate("/checkout");
  };

  if (cart.length === 0) {
    return (
      <div className="empty-cart">
        <h2>{i18nT("emptyCart")}</h2>
        {!loading && recommendation && (
          <div
            className="recommendation-card"
            style={{
              background: "linear-gradient(to right, #e3f2fd, #f3e5f5)",
              padding: "20px",
              borderRadius: "12px",
              margin: "20px auto",
              maxWidth: "500px",
              border: "2px solid #333",
              cursor: "pointer",
            }}
            onClick={handleRecommendationClick}
          >
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>
              {recommendation.emoji}
            </div>
            <h3
              style={{ fontSize: "20px", marginBottom: "10px", color: "#333" }}
            >
              Try: {t(recommendation.name)}
            </h3>
            <p style={{ fontSize: "14px", color: "#666" }}>
              {recommendation.reason}
            </p>
            <p style={{ fontSize: "14px", color: "#1976d2", fontWeight: "bold", marginTop: "10px" }}>
              Click to customize →
            </p>
          </div>
        )}
        <button className="back-button" onClick={() => navigate("/menu")}>
          {i18nT("backToMenu")}
        </button>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-header">
        <button className="back-button" onClick={() => navigate("/menu")}>
          ← {i18nT("backToMenu")}
        </button>
        <h1>{i18nT("cart")}</h1>
      </div>

      {!loading && recommendation && (
        <div
          className="recommendation-card"
          style={{
            background: "linear-gradient(to right, #4fc3f7, #ba68c8)",
            padding: "20px",
            borderRadius: "12px",
            marginBottom: "20px",
            color: "white",
            border: "2px solid #333",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "15px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <div style={{ fontSize: "50px" }}>{recommendation.emoji}</div>
            <div>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  marginBottom: "5px",
                }}
              >
                Try this: {t(recommendation.name)}
              </h3>
              <p style={{ fontSize: "14px", color: "#e3f2fd" }}>
                {recommendation.reason}
              </p>
            </div>
          </div>
          <button
            style={{
              background: "white",
              color: "#ba68c8",
              padding: "10px 20px",
              border: "2px solid #333",
              borderRadius: "20px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
            onClick={handleRecommendationClick}
          >
            Add to Order
          </button>
        </div>
      )}

      {cart.map((item) => {
        const translatedToppings = item.toppings
          .map((topping) => t(topping.name))
          .join(", ");
        const itemQuantity = item.quantity || 1;
        const pricePerItem = item.price / itemQuantity;

        return (
          <div key={item.id} className="cart-item">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "10px",
                width: "100%",
              }}
            >
              <h3 style={{ margin: 0, flexShrink: 0 }}>{t(item.name)}</h3>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexShrink: 0,
                }}
              >
                <button
                  onClick={() => handleEditItem(item)}
                  style={{
                    padding: "6px 12px",
                    fontSize: "14px",
                    fontWeight: "bold",
                    borderRadius: "4px",
                    border: "2px solid #2196f3",
                    background: "#e3f2fd",
                    color: "#1976d2",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                  title="Edit this item"
                >
                  {i18nT("Edit")}
                </button>
                <button
                  onClick={() => updateCartItemQuantity(item.id, -1)}
                  style={{
                    width: "32px",
                    height: "32px",
                    fontSize: "18px",
                    fontWeight: "bold",
                    borderRadius: "4px",
                    border: "2px solid #333",
                    background: "#fff",
                    color: "#000",
                    cursor: "pointer",
                    flexShrink: 0,
                    padding: 0,
                  }}
                >
                  <span style={{ color: "#000" }}>-</span>
                </button>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    minWidth: "25px",
                    textAlign: "center",
                    color: "#000",
                  }}
                >
                  {itemQuantity}
                </span>
                <button
                  onClick={() => updateCartItemQuantity(item.id, 1)}
                  style={{
                    width: "32px",
                    height: "32px",
                    fontSize: "18px",
                    fontWeight: "bold",
                    borderRadius: "4px",
                    border: "2px solid #333",
                    background: "#fff",
                    color: "#000",
                    cursor: "pointer",
                    flexShrink: 0,
                    padding: 0,
                  }}
                >
                  <span style={{ color: "#000" }}>+</span>
                </button>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                width: "100%",
              }}
            >
              <div style={{ flexShrink: 0 }}>
                <p>
                  <strong>{i18nT("size")}:</strong> {t(item.size)},{" "}
                  <strong>{i18nT("Temperature")}:</strong> {t(item.temperature || "Cold")}
                  {item.temperature !== "Hot" && item.iceLevel && (
                    <>, <strong>{i18nT("ice")}:</strong> {t(item.iceLevel)}</>
                  )}
                  , <strong>{i18nT("sweetness")}:</strong>{" "}
                  {t(item.sweetnessLevel)}
                </p>
                {item.toppings.length > 0 && (
                  <p>
                    <strong>{i18nT("toppings")}:</strong> {translatedToppings}
                  </p>
                )}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p
                  className="price"
                  style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}
                >
                  ${item.price.toFixed(2)}
                </p>
                {itemQuantity > 1 && (
                  <p style={{ fontSize: "12px", color: "#666", margin: 0 }}>
                    ${pricePerItem.toFixed(2)} × {itemQuantity}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <div className="cart-total">
        <h2>
          {i18nT("total")}: ${cartTotal.toFixed(2)}
        </h2>
        <button className="place-order-btn" onClick={handleProceedToCheckout}>
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
