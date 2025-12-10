import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import StripePaymentForm from '../components/StripePaymentForm';
import '../styles/CheckoutPage.css';

// Load Stripe outside component to avoid recreating on each render
// Disable developer tools to hide the Stripe button in bottom right
let stripePromise = null;
const getStripePromise = async () => {
  if (!stripePromise) {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/stripe-config`);
    const { publishableKey } = await response.json();
    stripePromise = loadStripe(publishableKey, {
      developerTools: {
        assistant: {
          enabled: false
        }
      }
    });
  }
  return stripePromise;
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { t: i18nT } = useTranslation();
  const { cart, cartTotal, clearCart, user, t } = useApp();
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stripe, setStripe] = useState(null);

  // Initialize Stripe
  useEffect(() => {
    getStripePromise().then(setStripe);
  }, []);

  // Create payment intent when user selects card payment
  useEffect(() => {
    if (paymentMethod === 'CARD' && cartTotal > 0) {
      createPaymentIntent();
    }
  }, [paymentMethod, cartTotal]);

  const createPaymentIntent = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: cartTotal })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      setClientSecret(data.clientSecret);
    } catch (err) {
      console.error('Payment intent error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCashPayment = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          total: cartTotal,
          customerEmail: user?.email || 'guest@example.com',
          paymentMethod: 'CASH',
          paymentIntentId: null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Order failed');
      }

      console.log('Cash order successful! Order ID:', data.orderId);

      // Show confirmation popup
      alert(`Order Confirmed!\n\nYour Order Number: #${data.orderId}\n\nPlease proceed to the counter to pay with cash and pick up your order.`);

      clearCart();
      navigate('/confirmation', { state: { orderId: data.orderId } });
    } catch (err) {
      console.error('Order failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCardPaymentSuccess = async (paymentIntentId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          total: cartTotal,
          customerEmail: user?.email || 'guest@example.com',
          paymentMethod: 'CARD',
          paymentIntentId: paymentIntentId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Order failed');
      }

      console.log('Card order successful! Order ID:', data.orderId);

      // Show confirmation popup
      alert(`Order Confirmed!\n\nYour Order Number: #${data.orderId}\n\nPayment successful! Please proceed to the counter to pick up your order.`);

      clearCart();
      navigate('/confirmation', { state: { orderId: data.orderId } });
    } catch (err) {
      console.error('Order failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Redirect to cart if cart is empty
  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <button className="back-button" onClick={() => navigate('/cart')}>
          ← {i18nT('backToMenu')}
        </button>
        <h1>Checkout</h1>
      </div>

      {/* Order Summary */}
      <div className="order-summary">
        <h2>Order Summary</h2>
        <div className="summary-items">
          {cart.map(item => (
            <div key={item.id} className="summary-item">
              <div>
                <strong>{t(item.name)}</strong>
                <p style={{ fontSize: '0.9em', color: '#666' }}>
                  {t(item.size)} • {t(item.temperature || "Cold")}
                  {item.temperature !== "Hot" && item.iceLevel && ` • ${t(item.iceLevel)}`}
                  {' • '}{t(item.sweetnessLevel)}
                  {item.toppings.length > 0 && ` • ${item.toppings.map(tp => t(tp.name)).join(', ')}`}
                </p>
              </div>
              <span className="item-price">${item.price.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="summary-total">
          <strong>Total</strong>
          <strong>${cartTotal.toFixed(2)}</strong>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="payment-method-selector">
        <h2>Payment Method</h2>
        <div className="payment-options">
          <button
            className={`payment-option ${paymentMethod === 'CASH' ? 'selected' : ''}`}
            onClick={() => setPaymentMethod('CASH')}
          >
            <div className="payment-icon">💵</div>
            <span>Cash</span>
          </button>
          <button
            className={`payment-option ${paymentMethod === 'CARD' ? 'selected' : ''}`}
            onClick={() => setPaymentMethod('CARD')}
          >
            <div className="payment-icon">💳</div>
            <span>Card</span>
          </button>
        </div>
      </div>

      {/* Payment Form */}
      <div className="payment-section">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {paymentMethod === 'CASH' ? (
          <div className="cash-payment">
            <p className="payment-info">
              Pay with cash when you pick up your order at the counter.
            </p>
            <button
              className="complete-order-btn"
              onClick={handleCashPayment}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Complete Order (Cash)'}
            </button>
          </div>
        ) : (
          <div className="card-payment">
            {loading && !clientSecret ? (
              <div className="loading-spinner">Preparing payment...</div>
            ) : clientSecret && stripe ? (
              <Elements stripe={stripe} options={{ clientSecret }}>
                <StripePaymentForm
                  total={cartTotal}
                  onSuccess={handleCardPaymentSuccess}
                  onError={setError}
                />
              </Elements>
            ) : (
              <div className="loading-spinner">Loading payment form...</div>
            )}

            <div className="test-cards-info">
              <h4>Test Cards (For Development)</h4>
              <ul>
                <li>Visa: <code>4242 4242 4242 4242</code></li>
                <li>Visa (debit): <code>4000 0566 5566 5556</code></li>
                <li>Mastercard: <code>5555 5555 5555 4444</code></li>
                <li>Any future expiration date, any CVC, any postal code</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
