import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApp } from "../context/AppContext";
import {
  useWeather,
  getDrinkRecommendation,
  findRecommendedDrinkId,
} from "../components/weather";

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

  // Helper function to translate weather recommendation reasons
  const translateReason = (reason) => {
    if (!reason) return "";

    // Extract temperature from the string (including decimals)
    const tempMatch = reason.match(/(\d+\.?\d*)°F/);
    const temp = tempMatch ? tempMatch[1] : "";

    // Match patterns and translate
    if (reason.includes("perfect weather for something refreshing")) {
      return `${t("It's")} ${temp}°F - ${t(
        "perfect weather for something refreshing!"
      )}`;
    }
    if (reason.includes("warm up with a hot drink")) {
      return `${t("It's only")} ${temp}°F - ${t("warm up with a hot drink!")}`;
    }
    if (reason.includes("cozy up with something warm")) {
      return `${t("Rainy day at")} ${temp}°F - ${t(
        "cozy up with something warm!"
      )}`;
    }
    if (reason.includes("stay cozy")) {
      return `${t("Snowy weather at")} ${temp}°F - ${t("stay cozy!")}`;
    }
    if (reason.includes("weather for our bestseller")) {
      return `${t("Perfect")} ${temp}°F ${t("weather for our bestseller!")}`;
    }

    return reason;
  };

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
              cursor: "pointer",
            }}
            onClick={handleRecommendationClick}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "10px" }}>
              {recommendation.emoji}
            </div>
            <h3
              style={{ fontSize: "1.25rem", marginBottom: "10px", color: "#333" }}
            >
              {i18nT("Try")}: {t(recommendation.name)}
            </h3>
            <p style={{ fontSize: "0.875rem", color: "#666" }}>
              {translateReason(recommendation.reason)}
            </p>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#1976d2",
                fontWeight: "bold",
                marginTop: "10px",
              }}
            >
              {i18nT("Click to customize →")}
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
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "15px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <div style={{ fontSize: "3.125rem" }}>{recommendation.emoji}</div>
            <div>
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  marginBottom: "5px",
                }}
              >
                {i18nT("Try this")}: {t(recommendation.name)}
              </h3>
              <p style={{ fontSize: "0.875rem", color: "#e3f2fd" }}>
                {translateReason(recommendation.reason)}
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
            {i18nT("Add to Order")}
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
                  className="cart-edit-btn"
                  onClick={() => handleEditItem(item)}
                  style={{
                    padding: "6px 12px",
                    fontSize: "0.875rem",
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
                  className="cart-quantity-btn"
                  onClick={() => updateCartItemQuantity(item.id, -1)}
                  style={{
                    width: "32px",
                    height: "32px",
                    fontSize: "1.125rem",
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
                    fontSize: "1rem",
                    fontWeight: "bold",
                    minWidth: "25px",
                    textAlign: "center",
                    color: "#000",
                  }}
                >
                  {itemQuantity}
                </span>
                <button
                  className="cart-quantity-btn"
                  onClick={() => updateCartItemQuantity(item.id, 1)}
                  style={{
                    width: "32px",
                    height: "32px",
                    fontSize: "1.125rem",
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
                  <strong>{i18nT("Temperature")}:</strong>{" "}
                  {t(item.temperature || "Cold")}
                  {item.temperature !== "Hot" && item.iceLevel && (
                    <>
                      , <strong>{i18nT("ice")}:</strong> {t(item.iceLevel)}
                    </>
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
                  style={{ margin: 0, fontSize: "1.125rem", fontWeight: "bold" }}
                >
                  ${item.price.toFixed(2)}
                </p>
                {itemQuantity > 1 && (
                  <p style={{ fontSize: "0.75rem", color: "#666", margin: 0 }}>
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
          {i18nT("Proceed to Checkout")}
        </button>
      </div>
    </div>
  );
}
