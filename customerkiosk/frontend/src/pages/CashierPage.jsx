import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/CashierPage.css';

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
  const navigate = useNavigate();

  // Load products, order ID, and customizations
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, orderIdRes, customizationsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/cashier/products`),
          fetch(`${import.meta.env.VITE_API_URL}/api/cashier/next-order-id`),
          fetch(`${import.meta.env.VITE_API_URL}/api/customizations`)
        ]);

        const productsData = await productsRes.json();
        const orderIdData = await orderIdRes.json();
        const customizationsData = await customizationsRes.json();

        setProducts(productsData);
        setOrderId(orderIdData.nextOrderId);
        setCustomizations(customizationsData);
        setLoading(false);
      } catch (err) {
        console.error('Error loading cashier data:', err);
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
    // Add customized item to cart with unique ID based on timestamp
    const cartItem = {
      cart_item_id: Date.now(), // Unique ID for each cart item
      product_id: customizedItem.product_id,
      product_name: customizedItem.product_name,
      quantity: 1,
      price_per_unit: customizedItem.price_per_unit,
      subtotal: customizedItem.price_per_unit,
      customizations: customizedItem.customizations // Store customization details
    };

    setCart([...cart, cartItem]);
    setShowCustomizeModal(false);
    setSelectedProduct(null);
  };

  const removeFromCart = (cartItemId) => {
    // Remove item by cart_item_id (unique for each customization)
    setCart(cart.filter(item => item.cart_item_id !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const submitOrder = async () => {
    if (cart.length === 0) {
      alert('Please add items to the order before submitting.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/cashier/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items: cart })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Order #${data.orderId} submitted successfully!\nTotal: $${data.totalPrice.toFixed(2)}`);

        // Clear cart and get next order ID
        setCart([]);
        const orderIdRes = await fetch(`${import.meta.env.VITE_API_URL}/api/cashier/next-order-id`);
        const orderIdData = await orderIdRes.json();
        setOrderId(orderIdData.nextOrderId);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error('Error submitting order:', err);
      alert('Failed to submit order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
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
    return <div className="cashier-loading">Loading cashier mode...</div>;
  }

  return (
    <div className="cashier-page">
      <div className="cashier-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate('/menu')}>
            ← Back to Customer View
          </button>
          <h1>Cashier Mode</h1>
        </div>
        <div className="header-right">
          <div className="order-info">
            <span className="order-id">Order ID: {orderId}</span>
            <span className="current-time">{formatTime(currentTime)}</span>
          </div>
        </div>
      </div>

      <div className="cashier-content">
        <div className="products-section">
          <h2>Products</h2>
          <div className="categories">
            {Object.entries(productsByCategory).map(([category, items]) => (
              <div key={category} className="category-section">
                <h3>{category}</h3>
                <div className="product-grid">
                  {items.map(product => (
                    <button
                      key={product.product_id}
                      className="product-button"
                      onClick={() => openCustomizeModal(product)}
                    >
                      <span className="product-name">{product.name}</span>
                      <span className="product-price">${parseFloat(product.price).toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="cart-section">
          <h2>Current Order</h2>
          <div className="cart-items">
            {cart.length === 0 ? (
              <div className="empty-cart">No items in cart</div>
            ) : (
              cart.map(item => (
                <div key={item.cart_item_id} className="cart-item">
                  <div className="item-info">
                    <span className="item-name">
                      {item.product_name}
                      {item.customizations && (
                        <span className="customization-details">
                          <br/>
                          <small>
                            {item.customizations.size} | {item.customizations.iceLevel} | {item.customizations.sweetnessLevel}
                            {item.customizations.toppings.length > 0 && (
                              <> | +{item.customizations.toppings.map(t => t.name).join(', ')}</>
                            )}
                          </small>
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="item-actions">
                    <span className="item-subtotal">${item.subtotal.toFixed(2)}</span>
                    <button
                      className="remove-button"
                      onClick={() => removeFromCart(item.cart_item_id)}
                      title="Remove item"
                    >
                      −
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="cart-footer">
            <div className="cart-total">
              <span>Total:</span>
              <span className="total-amount">${calculateTotal().toFixed(2)}</span>
            </div>

            <div className="cart-actions">
              <button
                className="clear-button"
                onClick={clearCart}
                disabled={cart.length === 0}
              >
                Clear Order
              </button>
              <button
                className="submit-button"
                onClick={submitOrder}
                disabled={cart.length === 0 || submitting}
              >
                {submitting ? 'Submitting...' : 'Finish Order'}
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
          }}
        />
      )}
    </div>
  );
}

// Customization Modal Component
function CustomizeModal({ product, customizations, onAdd, onCancel }) {
  const [size, setSize] = useState('Medium');
  const [iceLevel, setIceLevel] = useState('Regular Ice');
  const [sweetnessLevel, setSweetnessLevel] = useState('50%');
  const [selectedToppings, setSelectedToppings] = useState([]);

  const toggleTopping = (topping) => {
    const normalizeId = (id) => String(id);
    const clickedId = normalizeId(topping.id);

    const existingIndex = selectedToppings.findIndex(t => normalizeId(t.id) === clickedId);

    if (existingIndex >= 0) {
      setSelectedToppings(selectedToppings.filter((_, index) => index !== existingIndex));
    } else {
      setSelectedToppings([...selectedToppings, topping]);
    }
  };

  const calculatePrice = () => {
    let price = parseFloat(product.price);

    // Add size multiplier
    if (size === 'Large') price *= 1.5;
    if (size === 'Small') price *= 0.8;

    // Add topping prices
    selectedToppings.forEach(topping => {
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
        iceLevel,
        sweetnessLevel,
        toppings: selectedToppings
      }
    });
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Customize {product.name}</h2>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>

        <div className="modal-body">
          <div className="customization-section">
            <h3>Size</h3>
            <div className="button-group">
              {customizations.sizes.map(s => (
                <button
                  key={s}
                  className={size === s ? 'selected' : ''}
                  onClick={() => setSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="customization-section">
            <h3>Ice Level</h3>
            <div className="button-group">
              {customizations.iceOptions.map(option => (
                <button
                  key={option}
                  className={iceLevel === option ? 'selected' : ''}
                  onClick={() => setIceLevel(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="customization-section">
            <h3>Sweetness</h3>
            <div className="button-group">
              {customizations.sweetnessOptions.map(option => (
                <button
                  key={option}
                  className={sweetnessLevel === option ? 'selected' : ''}
                  onClick={() => setSweetnessLevel(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="customization-section">
            <h3>Toppings</h3>
            <div className="button-group">
              {customizations.toppings.map(topping => {
                const normalizeId = (id) => String(id);
                const toppingId = normalizeId(topping.id);
                const isSelected = selectedToppings.some(t => normalizeId(t.id) === toppingId);

                return (
                  <button
                    key={`topping-${topping.id}`}
                    className={isSelected ? 'selected' : ''}
                    onClick={() => toggleTopping(topping)}
                  >
                    {topping.name} (+${topping.price}) {isSelected ? '✓' : ''}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="modal-total">
            <span>Total:</span>
            <span className="price">${calculatePrice().toFixed(2)}</span>
          </div>
          <div className="modal-actions">
            <button className="cancel-btn" onClick={onCancel}>Cancel</button>
            <button className="add-btn" onClick={handleAdd}>Add to Order</button>
          </div>
        </div>
      </div>
    </div>
  );
}
