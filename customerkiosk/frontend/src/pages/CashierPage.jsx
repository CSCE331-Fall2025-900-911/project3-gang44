import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApp } from "../context/AppContext";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import StripePaymentForm from '../components/StripePaymentForm';
import "../styles/CashierPage.css";

// Load Stripe (disable developer tools)
let stripePromise = null;
const getStripePromise = async () => {
  if (!stripePromise) {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/stripe-config`);
    const { publishableKey } = await response.json();
    stripePromise = loadStripe(publishableKey, {
      developerTools: { assistant: { enabled: false } }
    });
  }
  return stripePromise;
};

export default function CashierPage() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [submitting, setSubmitting] = useState(false);
  const [customizations, setCustomizations] = useState(null);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [stripe, setStripe] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [editingCartItem, setEditingCartItem] = useState(null);
  const navigate = useNavigate();
  const { t: i18nT } = useTranslation(); // For UI labels
  const { t } = useApp(); // For API translations

  // Initialize Stripe
  useEffect(() => {
    getStripePromise().then(setStripe);
  }, []);

  // Load products, order ID, and customizations
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, orderIdRes, customizationsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/cashier/products`),
          fetch(`${import.meta.env.VITE_API_URL}/api/cashier/next-order-id`),
          fetch(`${import.meta.env.VITE_API_URL}/api/customizations`),
        ]);

        const productsData = await productsRes.json();
        const orderIdData = await orderIdRes.json();
        const customizationsData = await customizationsRes.json();

        setProducts(productsData);
        setOrderId(orderIdData.nextOrderId);
        setCustomizations(customizationsData);
        setLoading(false);
      } catch (err) {
        console.error("Error loading cashier data:", err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const openCustomizeModal = (product) => {
    setSelectedProduct(product);
    setShowCustomizeModal(true);
  };

  const addToCartWithCustomization = (customizedItem) => {
    if (editingCartItem) {
      // Update existing item
      setCart(cart.map((item) =>
        item.cart_item_id === editingCartItem.cart_item_id
          ? {
              ...item,
              price_per_unit: customizedItem.price_per_unit,
              subtotal: customizedItem.price_per_unit * item.quantity,
              customizations: customizedItem.customizations,
            }
          : item
      ));
      setEditingCartItem(null);
    } else {
      // Add new customized item to cart with unique ID based on timestamp
      const cartItem = {
        cart_item_id: Date.now(), // Unique ID for each cart item
        product_id: customizedItem.product_id,
        product_name: customizedItem.product_name,
        quantity: 1,
        price_per_unit: customizedItem.price_per_unit,
        subtotal: customizedItem.price_per_unit,
        customizations: customizedItem.customizations, // Store customization details
      };
      setCart([...cart, cartItem]);
    }

    setShowCustomizeModal(false);
    setSelectedProduct(null);
  };

  const removeFromCart = (cartItemId) => {
    // Remove item by cart_item_id (unique for each customization)
    setCart(cart.filter((item) => item.cart_item_id !== cartItemId));
  };

  const editCartItem = (cartItem) => {
    // Open customization modal with existing item data
    const product = products.find((p) => p.product_id === cartItem.product_id);
    if (product) {
      setSelectedProduct(product);
      setEditingCartItem(cartItem);
      setShowCustomizeModal(true);
    }
  };

  const updateCartItemQuantity = (cartItemId, delta) => {
    setCart(cart.map((item) => {
      if (item.cart_item_id === cartItemId) {
        const newQuantity = item.quantity + delta;
        if (newQuantity <= 0) {
          // Remove item if quantity reaches 0
          return null;
        }
        return {
          ...item,
          quantity: newQuantity,
          subtotal: item.price_per_unit * newQuantity
        };
      }
      return item;
    }).filter(Boolean)); // Remove null entries
  };

  const clearCart = () => {
    setCart([]);
  };

  const submitOrder = async () => {
    if (cart.length === 0) {
      alert(i18nT("Please add items to the order before submitting."));
      return;
    }

    // If card payment, show payment modal
    if (paymentMethod === 'CARD') {
      await createPaymentIntent();
      setShowPaymentModal(true);
      return;
    }

    // Process cash payment directly
    await submitCashOrder();
  };

  const createPaymentIntent = async () => {
    try {
      setSubmitting(true);
      const total = calculateTotal();

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      setClientSecret(data.clientSecret);
    } catch (err) {
      console.error('Payment intent error:', err);
      alert(`Failed to initialize payment: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const submitCashOrder = async () => {
    console.log('submitCashOrder called');
    setSubmitting(true);

    try {
      console.log('Sending cash order request...');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/cashier/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ items: cart, paymentMethod: 'CASH' }),
        }
      );

      const data = await response.json();
      console.log('Cash order response:', data);

      if (response.ok) {
        console.log('Showing confirmation for order:', data.orderId);

        // Show confirmation modal
        setConfirmationMessage(
          `💵 Cash Order #${data.orderId}\n\nTotal: $${data.totalPrice.toFixed(2)}\n\nCollect cash from customer.`
        );
        setShowConfirmation(true);

        // Clear cart and get next order ID
        setCart([]);
        setPaymentMethod('CASH');
        const orderIdRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/cashier/next-order-id`
        );
        const orderIdData = await orderIdRes.json();
        setOrderId(orderIdData.nextOrderId);
      } else {
        console.error('Order failed:', data.error);
        setConfirmationMessage(`Error: ${data.error}`);
        setShowConfirmation(true);
      }
    } catch (err) {
      console.error("Error submitting order:", err);
      alert("Failed to submit order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCardPaymentSuccess = async (paymentIntentId) => {
    console.log('handleCardPaymentSuccess called with paymentIntentId:', paymentIntentId);
    setSubmitting(true);

    try {
      console.log('Sending card order request with payment intent...');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/cashier/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: cart,
            paymentMethod: 'CARD',
            paymentIntentId
          }),
        }
      );

      const data = await response.json();
      console.log('Card order response:', data);

      if (response.ok) {
        console.log('Card order successful, closing modal and showing confirmation');
        setShowPaymentModal(false);

        // Show confirmation modal
        setConfirmationMessage(
          `💳 Card Payment Successful!\n\nOrder #${data.orderId}\nTotal: $${data.totalPrice.toFixed(2)}\n\nPayment processed successfully.`
        );
        setShowConfirmation(true);

        // Clear cart and get next order ID
        setCart([]);
        setPaymentMethod('CASH');
        setClientSecret('');
        const orderIdRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/cashier/next-order-id`
        );
        const orderIdData = await orderIdRes.json();
        setOrderId(orderIdData.nextOrderId);
      } else {
        console.error('Card order failed:', data.error);
        setConfirmationMessage(`Error: ${data.error}`);
        setShowConfirmation(true);
      }
    } catch (err) {
      console.error("Error submitting order:", err);
      alert("Failed to submit order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  // Group products by category
  const productsByCategory = products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="cashier-loading">{i18nT("Loading cashier mode...")}</div>
    );
  }

  return (
    <div className="cashier-page">
      <div className="cashier-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate("/")}>
            ← {i18nT("Back to Landing Page")}
          </button>
          <h1>{i18nT("Cashier Mode")}</h1>
        </div>
        <div className="header-right">
          <div className="order-info">
            <span className="order-id">
              {i18nT("Order ID")}: {orderId}
            </span>
            <span className="current-time">{formatTime(currentTime)}</span>
          </div>
        </div>
      </div>

      <div className="cashier-content">
        <div className="products-section">
          <h2>{i18nT("Products")}</h2>
          <div className="categories">
            {Object.entries(productsByCategory).map(([category, items]) => (
              <div key={category} className="category-section">
                <h3>{t(category)}</h3>
                <div className="product-grid">
                  {items.map((product) => (
                    <button
                      key={product.product_id}
                      className="product-button"
                      onClick={() => openCustomizeModal(product)}
                    >
                      <span className="product-name">{t(product.name)}</span>
                      <span className="product-price">
                        ${parseFloat(product.price).toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="cart-section">
          <h2>{i18nT("Current Order")}</h2>
          <div className="cart-items">
            {cart.length === 0 ? (
              <div className="empty-cart">{i18nT("No items in cart")}</div>
            ) : (
              cart.map((item) => (
                <div key={item.cart_item_id} className="cart-item">
                  <div className="item-info">
                    <span className="item-name">
                      {t(item.product_name)}
                      {item.customizations && (
                        <span className="customization-details">
                          <br />
                          <small>
                            {t(item.customizations.size)} |{" "}
                            {t(item.customizations.temperature || "Cold")}
                            {item.customizations.temperature !== "Hot" && item.customizations.iceLevel && (
                              <> | {t(item.customizations.iceLevel)}</>
                            )}
                            {" "} | {t(item.customizations.sweetnessLevel)}
                            {item.customizations.toppings.length > 0 && (
                              <>
                                {" "}
                                | +
                                {item.customizations.toppings
                                  .map((topping) => t(topping.name))
                                  .join(", ")}
                              </>
                            )}
                          </small>
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="item-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="item-subtotal">
                      ${item.subtotal.toFixed(2)}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => editCartItem(item)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          borderRadius: '4px',
                          border: '2px solid #2196f3',
                          background: '#e3f2fd',
                          color: '#1976d2',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                        title="Edit this item"
                      >
                        {i18nT("Edit")}
                      </button>
                      <button
                        onClick={() => updateCartItemQuantity(item.cart_item_id, -1)}
                        style={{
                          width: '30px',
                          height: '30px',
                          fontSize: '18px',
                          fontWeight: 'bold',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                          background: '#fff',
                          color: '#000',
                          cursor: 'pointer',
                          padding: 0
                        }}
                        title="Decrease quantity"
                      >
                        <span style={{ color: '#000' }}>-</span>
                      </button>
                      <span style={{ minWidth: '25px', textAlign: 'center', fontWeight: 'bold', color: '#000' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartItemQuantity(item.cart_item_id, 1)}
                        style={{
                          width: '30px',
                          height: '30px',
                          fontSize: '18px',
                          fontWeight: 'bold',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                          background: '#fff',
                          color: '#000',
                          cursor: 'pointer',
                          padding: 0
                        }}
                        title="Increase quantity"
                      >
                        <span style={{ color: '#000' }}>+</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="cart-footer">
            <div className="cart-total">
              <span>{i18nT("total")}:</span>
              <span className="total-amount">
                ${calculateTotal().toFixed(2)}
              </span>
            </div>

            <div className="payment-method-section">
              <h3 style={{ marginBottom: '10px', fontSize: '16px' }}>{i18nT("Payment Method")}:</h3>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <button
                  className={`payment-method-btn ${paymentMethod === 'CASH' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('CASH')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: paymentMethod === 'CASH' ? '3px solid #4caf50' : '2px solid #ddd',
                    borderRadius: '8px',
                    background: paymentMethod === 'CASH' ? '#e8f5e9' : 'white',
                    cursor: 'pointer',
                    fontWeight: paymentMethod === 'CASH' ? 'bold' : 'normal',
                    fontSize: '16px',
                  }}
                >
                  💵 {i18nT("Cash")}
                </button>
                <button
                  className={`payment-method-btn ${paymentMethod === 'CARD' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('CARD')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: paymentMethod === 'CARD' ? '3px solid #2196f3' : '2px solid #ddd',
                    borderRadius: '8px',
                    background: paymentMethod === 'CARD' ? '#e3f2fd' : 'white',
                    cursor: 'pointer',
                    fontWeight: paymentMethod === 'CARD' ? 'bold' : 'normal',
                    fontSize: '16px',
                  }}
                >
                  💳 {i18nT("Card")}
                </button>
              </div>
            </div>

            <div className="cart-actions">
              <button
                className="clear-button"
                onClick={clearCart}
                disabled={cart.length === 0}
              >
                {i18nT("Clear Order")}
              </button>
              <button
                className="submit-button"
                onClick={submitOrder}
                disabled={cart.length === 0 || submitting}
              >
                {submitting ? i18nT("Submitting...") : i18nT("Finish Order")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customization Modal */}
      {showCustomizeModal && selectedProduct && customizations && (
        <CustomizeModal
          product={selectedProduct}
          customizations={customizations}
          onAdd={addToCartWithCustomization}
          onCancel={() => {
            setShowCustomizeModal(false);
            setSelectedProduct(null);
            setEditingCartItem(null);
          }}
          editMode={editingCartItem}
        />
      )}

      {/* Card Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => {
          setShowPaymentModal(false);
          setClientSecret(''); // Clear client secret when closing
        }}>
          <div className="modal-content payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💳 Process Card Payment</h2>
              <button className="modal-close" onClick={() => {
                setShowPaymentModal(false);
                setClientSecret(''); // Clear client secret when closing
              }}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div style={{ marginBottom: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Order Total</h3>
                <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#4caf50' }}>
                  ${calculateTotal().toFixed(2)}
                </p>
              </div>

              {clientSecret && stripe ? (
                <Elements stripe={stripe} options={{ clientSecret }}>
                  <StripePaymentForm
                    total={calculateTotal()}
                    onSuccess={handleCardPaymentSuccess}
                    onError={(error) => {
                      setConfirmationMessage(`Payment failed: ${error}`);
                      setShowConfirmation(true);
                      setShowPaymentModal(false);
                      setClientSecret(''); // Clear client secret on error
                    }}
                  />
                </Elements>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: '18px', color: '#666' }}>Preparing payment...</div>
                </div>
              )}

              <div style={{
                marginTop: '20px',
                padding: '15px',
                background: '#fff3cd',
                borderRadius: '8px',
                border: '1px solid #ffc107'
              }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#856404' }}>
                  Test Cards
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#856404' }}>
                  <strong>4242 4242 4242 4242</strong> - Any future date, any CVC
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Confirmation Modal */}
      {showConfirmation && (
        <div className="modal-overlay" onClick={() => setShowConfirmation(false)}>
          <div className="modal-content confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: '3px solid #4caf50' }}>
              <h2 style={{ color: '#4caf50' }}>Order Confirmed!</h2>
              <button className="modal-close" onClick={() => setShowConfirmation(false)}>
                ×
              </button>
            </div>

            <div className="modal-body" style={{ textAlign: 'center', padding: '40px 30px' }}>
              <div style={{
                fontSize: '18px',
                whiteSpace: 'pre-line',
                lineHeight: '1.8',
                color: '#333'
              }}>
                {confirmationMessage}
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: 'none' }}>
              <button
                className="add-btn"
                onClick={() => setShowConfirmation(false)}
                style={{ width: '100%', padding: '15px', fontSize: '18px' }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Customization Modal Component
function CustomizeModal({ product, customizations, onAdd, onCancel, editMode }) {
  const { t: i18nT } = useTranslation(); // For UI labels
  const { t } = useApp(); // For API translations
  const [size, setSize] = useState(editMode?.customizations?.size || "Medium");
  const [temperature, setTemperature] = useState(editMode?.customizations?.temperature || "Cold");
  const [iceLevel, setIceLevel] = useState(editMode?.customizations?.iceLevel || "Regular Ice");
  const [sweetnessLevel, setSweetnessLevel] = useState(editMode?.customizations?.sweetnessLevel || "50%");
  const [selectedToppings, setSelectedToppings] = useState(editMode?.customizations?.toppings || []);

  const toggleTopping = (topping) => {
    const normalizeId = (id) => String(id);
    const clickedId = normalizeId(topping.id);

    const existingIndex = selectedToppings.findIndex(
      (t) => normalizeId(t.id) === clickedId
    );

    if (existingIndex >= 0) {
      setSelectedToppings(
        selectedToppings.filter((_, index) => index !== existingIndex)
      );
    } else {
      setSelectedToppings([...selectedToppings, topping]);
    }
  };

  const calculatePrice = () => {
    let price = parseFloat(product.price);

    // Add size multiplier
    if (size === "Large") price *= 1.5;
    if (size === "Small") price *= 0.8;

    // Add topping prices
    selectedToppings.forEach((topping) => {
      price += parseFloat(topping.price);
    });

    return price;
  };

  const handleAdd = () => {
    const finalPrice = calculatePrice();
    onAdd({
      product_id: product.product_id,
      product_name: product.name,
      price_per_unit: finalPrice,
      customizations: {
        size,
        temperature,
        iceLevel: temperature === "Hot" ? null : iceLevel,
        sweetnessLevel,
        toppings: selectedToppings,
      },
    });
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {editMode ? i18nT("Edit Item") : i18nT("Customize")}: {t(product.name)}
          </h2>
          <button className="modal-close" onClick={onCancel}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="customization-section">
            <h3>{i18nT("Size")}</h3>
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
              <h3>{i18nT("Ice Level")}</h3>
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
            <h3>{i18nT("Sweetness")}</h3>
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
            <h3>{i18nT("Toppings")}</h3>
            <div className="button-group">
              {customizations.toppings.map((topping) => {
                const normalizeId = (id) => String(id);
                const toppingId = normalizeId(topping.id);
                const isSelected = selectedToppings.some(
                  (t) => normalizeId(t.id) === toppingId
                );

                return (
                  <button
                    key={`topping-${topping.id}`}
                    className={isSelected ? "selected" : ""}
                    onClick={() => toggleTopping(topping)}
                  >
                    {t(topping.name)} (+${topping.price}){" "}
                    {isSelected ? "✓" : ""}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="modal-total">
            <span>{i18nT("total")}:</span>
            <span className="price">${calculatePrice().toFixed(2)}</span>
          </div>
          <div className="modal-actions">
            <button className="cancel-btn" onClick={onCancel}>
              {i18nT("Cancel")}
            </button>
            <button className="add-btn" onClick={handleAdd}>
              {editMode ? i18nT("Update Item") : i18nT("Add to Order")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
