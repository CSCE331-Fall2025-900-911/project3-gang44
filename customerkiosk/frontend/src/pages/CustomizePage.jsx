import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApp } from "../context/AppContext";

export default function CustomizePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editItemId = searchParams.get("edit");
  const { t: i18nT } = useTranslation(); // For UI labels
  const { addToCart, updateCartItem, cart, t, translate, language } = useApp(); // For API translations

  console.log("CustomizePage rendered with id:", id, "from useParams");
  console.log("Edit mode:", editItemId ? `Editing item ${editItemId}` : "Adding new item");

  const [drink, setDrink] = useState(null);
  const [customizations, setCustomizations] = useState(null);
  const [loading, setLoading] = useState(true);

  const [size, setSize] = useState("Medium");
  const [temperature, setTemperature] = useState("Cold");
  const [iceLevel, setIceLevel] = useState("Regular Ice");
  const [sweetnessLevel, setSweetnessLevel] = useState("50%");
  const [selectedToppings, setSelectedToppings] = useState([]); // Array of full topping objects
  const [quantity, setQuantity] = useState(1); // Quantity selector

  useEffect(() => {
    if (!id) {
      console.error("No product ID provided");
      setLoading(false);
      return;
    }

    // If in edit mode, load existing item data
    if (editItemId) {
      const itemToEdit = cart.find((item) => item.id === parseInt(editItemId));
      if (itemToEdit) {
        console.log("Found item to edit:", itemToEdit);
        setSize(itemToEdit.size || "Medium");
        setTemperature(itemToEdit.temperature || "Cold");
        setIceLevel(itemToEdit.iceLevel || "Regular Ice");
        setSweetnessLevel(itemToEdit.sweetnessLevel || "50%");
        setSelectedToppings(itemToEdit.toppings || []);
        setQuantity(itemToEdit.quantity || 1);
      }
    } else {
      // Reset selections and drink when ID changes (new item mode)
      setSelectedToppings([]);
      setSize("Medium");
      setTemperature("Cold");
      setIceLevel("Regular Ice");
      setSweetnessLevel("50%");
      setQuantity(1);
    }

    setDrink(null);
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
  }, [id, editItemId, cart]);

  // Ensure toppings added dynamically are seeded into translations cache
  useEffect(() => {
    if (!customizations || language === "en") return;
    try {
      customizations.toppings.forEach((top) => {
        if (top && top.name) {
          // Fire-and-forget to cache translations for topping names
          translate(top.name).catch((e) => {
            /* ignore */
          });
        }
      });
    } catch (e) {
      // ignore
    }
  }, [customizations, language]);

  // Add a document-root class so CSS can change the app background only
  // while this page is mounted (used by high-contrast styling).
  useEffect(() => {
    document.documentElement.classList.add("on-customize");
    return () => {
      document.documentElement.classList.remove("on-customize");
    };
  }, []);

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
  const getSizePriceDifference = (sizeOption) => {
    if (!drink) return 0;
    const basePrice = parseFloat(drink.price);
    let sizePrice = basePrice;

    // Calculate price for each size
    if (sizeOption === "Large") sizePrice = basePrice * 1.5;
    else if (sizeOption === "Small") sizePrice = basePrice * 0.8;
    // Medium is base price (no change)

    // Return the difference from base price
    return (sizePrice - basePrice).toFixed(2);
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

    // Multiply by quantity
    price *= quantity;

    return price.toFixed(2);
  };

  const calculatePricePerUnit = () => {
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
      temperature,
      iceLevel: temperature === "Hot" ? null : iceLevel,
      sweetnessLevel,
      toppings: selectedToppings,
      price: parseFloat(calculatePrice()),
      quantity: quantity,
    };

    if (editItemId) {
      // Update existing item
      console.log("Updating cart item:", editItemId, cartItem);
      updateCartItem(parseInt(editItemId), cartItem);
      navigate("/cart");
    } else {
      // Add new item
      console.log("Adding to cart:", cartItem);
      console.log("Drink name:", drink.name);
      console.log("Drink object:", drink);
      addToCart(cartItem);
      navigate("/menu");
    }
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
      <button className="back-button" onClick={() => navigate(editItemId ? "/cart" : "/menu")}>
        ← {editItemId ? i18nT("Back to Cart") : i18nT("backToMenu")}
      </button>

      <h1>{editItemId ? i18nT("Edit Item") : i18nT("customize")}</h1>
      <h2>{t(drink.name)}</h2>

      <div className="customization-section">
        <h3>{i18nT("size")}</h3>
        <div className="button-group">
        {customizations.sizes.map((s) => {
            const priceDiff = getSizePriceDifference(s);
            const priceDisplay = parseFloat(priceDiff) === 0 
              ? "" 
              : parseFloat(priceDiff) > 0 
                ? ` (+$${Math.abs(priceDiff)})` 
                : ` (-$${Math.abs(priceDiff)})`;
            
            return (
              <button
                key={s}
                className={size === s ? "selected" : ""}
                onClick={() => setSize(s)}
              >
                {t(s)}{priceDisplay}
              </button>
            );
          })}
        </div>
      </div>

      <div className="customization-section">
        <h3>{i18nT("Temperature")}</h3>
        <div className="button-group">
          {customizations.temperatureOptions.map((temp) => (
            <button
              key={temp}
              className={temperature === temp ? "selected" : ""}
              onClick={() => setTemperature(temp)}
            >
              {t(temp)}
            </button>
          ))}
        </div>
      </div>

      {temperature !== "Hot" && (
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
      )}

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
            ({i18nT("Select multiple")})
          </span>
        </h3>
        <div style={{ marginBottom: "10px", fontSize: "14px", color: "#666" }}>
          {i18nT("Selected")} : {selectedToppings.length} {i18nT("toppings")} -
          IDs: [{selectedToppings.map((topping) => topping.id).join(", ")}]
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

            // Log for debugging, then explicitly return the button element
            console.log(
              `Topping render: "${topping.name}" -> t()="${t(
                topping.name
              )}" (lang=${language})`
            );

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

      {/* Quantity Selector */}
      <div className="customization-section">
        <h3>{i18nT("Quantity")}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', justifyContent: 'center' }}>
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            style={{
              width: '40px',
              height: '40px',
              fontSize: '24px',
              fontWeight: 'bold',
              borderRadius: '8px',
              border: '2px solid #333',
              background: '#fff',
              color: '#000',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            disabled={quantity <= 1}
          >
            −
          </button>
          <span style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            minWidth: '50px', 
            textAlign: 'center' 
          }}>
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            style={{
              width: '40px',
              height: '40px',
              fontSize: '24px',
              fontWeight: 'bold',
              borderRadius: '8px',
              border: '2px solid #333',
              background: '#fff',
              color: '#000',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            +
          </button>
        </div>
      </div>

      <div className="price-section">
        <div style={{ marginBottom: '10px', fontSize: '16px', color: '#666' }}>
          {quantity > 1 && (
            <span>
              ${calculatePricePerUnit()} × {quantity} = 
            </span>
          )}
        </div>
        <h2>
          {i18nT("total")}: ${calculatePrice()}
        </h2>
        <button className="add-to-cart-btn" onClick={handleAddToCart}>
          {editItemId ? i18nT("Update Item") : i18nT("addToCart")}
        </button>
      </div>
    </div>
  );
}
