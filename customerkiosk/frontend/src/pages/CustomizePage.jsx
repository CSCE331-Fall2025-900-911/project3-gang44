import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApp } from "../context/AppContext";

export default function CustomizePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t: i18nT } = useTranslation(); // For UI labels
  const { addToCart, t } = useApp(); // For API translations

  console.log("CustomizePage rendered with id:", id, "from useParams");

  const [drink, setDrink] = useState(null);
  const [customizations, setCustomizations] = useState(null);
  const [loading, setLoading] = useState(true);

  const [size, setSize] = useState("Medium");
  const [iceLevel, setIceLevel] = useState("Regular Ice");
  const [sweetnessLevel, setSweetnessLevel] = useState("50%");
  const [selectedToppings, setSelectedToppings] = useState([]); // Array of full topping objects

  useEffect(() => {
    if (!id) {
      console.error("No product ID provided");
      setLoading(false);
      return;
    }

    // Reset selections and drink when ID changes
    setDrink(null);
    setSelectedToppings([]);
    setSize("Medium");
    setIceLevel("Regular Ice");
    setSweetnessLevel("50%");

    setLoading(true);
    let loadedCount = 0;
    const totalRequests = 2;

    const markLoaded = () => {
      loadedCount++;
      if (loadedCount === totalRequests) {
        setLoading(false);
      }
    };

    // Fetch all drinks
    fetch(`${import.meta.env.VITE_API_URL}/api/menu`)
      .then((res) => res.json())
      .then((data) => {
        console.log("All drinks:", data);
        console.log("URL param id:", id, "Type:", typeof id);
        // Try both string and number comparison, and handle both product_id and item_id
        const foundDrink = data.find((d) => {
          const drinkId = d.product_id || d.item_id;
          const searchId = parseInt(id) || id;
          return (
            drinkId === searchId ||
            drinkId === parseInt(id) ||
            String(drinkId) === String(id)
          );
        });
        console.log("Found drink:", foundDrink);
        if (!foundDrink) {
          console.error(
            "Drink not found. Available IDs:",
            data.map((d) => d.product_id || d.item_id)
          );
        }
        setDrink(foundDrink);
        markLoaded();
      })
      .catch((err) => {
        console.error("Error fetching drink:", err);
        markLoaded();
      });

    fetch(`${import.meta.env.VITE_API_URL}/api/customizations`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Customizations:", data);
        console.log("Toppings data:", data.toppings);
        console.log(
          "Topping IDs:",
          data.toppings?.map((t) => ({
            id: t.id,
            name: t.name,
            idType: typeof t.id,
          }))
        );
        // Verify all toppings have unique IDs
        const ids = data.toppings?.map((t) => t.id) || [];
        const uniqueIds = new Set(ids);
        console.log(
          "Total toppings:",
          ids.length,
          "Unique IDs:",
          uniqueIds.size
        );
        if (ids.length !== uniqueIds.size) {
          console.error("WARNING: Some toppings have duplicate IDs!");
        }
        setCustomizations(data);
        markLoaded();
      })
      .catch((err) => {
        console.error("Error fetching customizations:", err);
        markLoaded();
      });
  }, [id]);

  const toggleTopping = (topping) => {
    console.log("=== TOGGLE TOPPING ===");
    console.log("Clicked topping:", topping);
    console.log("Topping ID:", topping.id, "Type:", typeof topping.id);

    setSelectedToppings((prevToppings) => {
      console.log("Previous toppings:", prevToppings);
      console.log(
        "Previous topping IDs:",
        prevToppings.map((t) => ({ id: t.id, name: t.name }))
      );

      // Normalize IDs to strings for consistent comparison
      const normalizeId = (id) => {
        if (id === null || id === undefined) {
          console.error("WARNING: Topping has null/undefined ID!");
          return "undefined";
        }
        return String(id);
      };
      const clickedId = normalizeId(topping.id);

      // Check if this specific topping is already selected
      const existingIndex = prevToppings.findIndex((t) => {
        const tId = normalizeId(t.id);
        const match = tId === clickedId;
        console.log(`Comparing ${tId} with ${clickedId}: ${match}`);
        return match;
      });

      console.log("Existing index:", existingIndex);

      if (existingIndex >= 0) {
        // Remove the topping - create new array without this one
        const filtered = prevToppings.filter(
          (_, index) => index !== existingIndex
        );
        console.log("REMOVED - New toppings:", filtered);
        return filtered;
      } else {
        // Add the topping - create new array with this one added
        const added = [...prevToppings, topping];
        console.log("ADDED - New toppings:", added);
        return added;
      }
    });
  };

  const calculatePrice = () => {
    if (!drink) return 0;
    let price = parseFloat(drink.price);

    // Add size multiplier
    if (size === "Large") price *= 1.5;
    if (size === "Small") price *= 0.8;

    // Add topping prices
    selectedToppings.forEach((topping) => {
      price += parseFloat(topping.price);
    });

    return price.toFixed(2);
  };

  const handleAddToCart = () => {
    const productId = drink.product_id || drink.item_id;
    const cartItem = {
      menuItemId: productId,
      name: drink.name,
      size,
      iceLevel,
      sweetnessLevel,
      toppings: selectedToppings,
      price: parseFloat(calculatePrice()),
      quantity: 1,
    };
    console.log("Adding to cart:", cartItem);
    console.log("Drink name:", drink.name);
    console.log("Drink object:", drink);
    addToCart(cartItem);
    navigate("/menu");
  };

  if (loading) return <div className="loading">{i18nT("Loading...")}</div>;
  if (!id) return <div className="loading">{i18nT("Invalid product ID")}</div>;
  if (!drink)
    return (
      <div className="loading">
        {i18nT("Drink not found (ID: {id})", { id })}
      </div>
    );
  if (!customizations)
    return <div className="loading">{i18nT("Loading options...")}</div>;

  return (
    <div className="customize-page">
      <button className="back-button" onClick={() => navigate("/menu")}>
        ← {i18nT("backToMenu")}
      </button>

      <h1>{i18nT("customize")}</h1>
      <h2>{t(drink.name)}</h2>

      <div className="customization-section">
        <h3>{i18nT("size")}</h3>
        <div className="button-group">
          {customizations.sizes.map((s) => (
            <button
              key={s}
              className={size === s ? "selected" : ""}
              onClick={() => setSize(s)}
            >
              {t(s)}
            </button>
          ))}
        </div>
      </div>

      <div className="customization-section">
        <h3>{i18nT("ice")}</h3>
        <div className="button-group">
          {customizations.iceOptions.map((option) => (
            <button
              key={option}
              className={iceLevel === option ? "selected" : ""}
              onClick={() => setIceLevel(option)}
            >
              {t(option)}
            </button>
          ))}
        </div>
      </div>

      <div className="customization-section">
        <h3>{i18nT("sweetness")}</h3>
        <div className="button-group">
          {customizations.sweetnessOptions.map((option) => (
            <button
              key={option}
              className={sweetnessLevel === option ? "selected" : ""}
              onClick={() => setSweetnessLevel(option)}
            >
              {t(option)}
            </button>
          ))}
        </div>
      </div>

      <div className="customization-section">
        <h3>
          {i18nT("toppings")}{" "}
          <span
            style={{ fontSize: "18px", fontWeight: "normal", color: "#666" }}
          >
            (Select multiple)
          </span>
        </h3>
        <div style={{ marginBottom: "10px", fontSize: "14px", color: "#666" }}>
          Selected: {selectedToppings.length} topping(s) - IDs: [
          {selectedToppings.map((topping) => topping.id).join(", ")}]
        </div>
        <div className="button-group">
          {customizations.toppings.map((topping) => {
            // Normalize IDs to strings for consistent comparison
            const normalizeId = (id) => String(id);
            const toppingId = normalizeId(topping.id);

            // Check if this specific topping is selected by comparing IDs
            const isSelected = selectedToppings.some((selectedTopping) => {
              const tId = normalizeId(selectedTopping.id);
              return tId === toppingId;
            });

            return (
              <button
                key={`topping-${topping.id}-${topping.name}`}
                className={isSelected ? "selected" : ""}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleTopping(topping);
                }}
              >
                {t(topping.name)} (+${topping.price}) {isSelected ? "✓" : ""}
              </button>
            );
          })}
        </div>
      </div>

      <div className="price-section">
        <h2>
          {i18nT("total")}: ${calculatePrice()}
        </h2>
        <button className="add-to-cart-btn" onClick={handleAddToCart}>
          {i18nT("addToCart")}
        </button>
      </div>
    </div>
  );
}
