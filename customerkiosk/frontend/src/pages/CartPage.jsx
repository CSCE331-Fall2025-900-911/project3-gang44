import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';

export default function CartPage() {
  const navigate = useNavigate();
  const { t: i18nT } = useTranslation(); // For UI labels
  const { cart, removeFromCart, cartTotal, clearCart, user, t } = useApp(); // For API translations

  const handlePlaceOrder = async () => {
    try {
      console.log('Placing order with cart:', cart);
      console.log('Cart total:', cartTotal);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          total: cartTotal,
          customerEmail: user?.email || 'guest@example.com'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Order failed with status:', response.status);
        console.error('Error data:', data);
        throw new Error(data.error || 'Order failed');
      }

      console.log('Order successful! Order ID:', data.orderId);
      clearCart();
      navigate('/confirmation', { state: { orderId: data.orderId } });
    } catch (error) {
      console.error('Order failed:', error);
      alert(`Order failed: ${error.message}. Please try again.`);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="empty-cart">
        <h2>{i18nT('emptyCart')}</h2>
        <button onClick={() => navigate('/menu')}>{i18nT('backToMenu')}</button>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>{i18nT('cart')}</h1>

      {cart.map(item => {
        // Translate database items using API
        const translatedToppings = item.toppings.map(topping => t(topping.name)).join(', ');

        return (
          <div key={item.id} className="cart-item">
            <h3>{t(item.name)}</h3>
            <p><strong>{i18nT('size')}:</strong> {t(item.size)}</p>
            <p><strong>{i18nT('ice')}:</strong> {t(item.iceLevel)}</p>
            <p><strong>{i18nT('sweetness')}:</strong> {t(item.sweetnessLevel)}</p>
            {item.toppings.length > 0 && (
              <p><strong>{i18nT('toppings')}:</strong> {translatedToppings}</p>
            )}
            <p className="price">${item.price.toFixed(2)}</p>
            <button onClick={() => removeFromCart(item.id)}>{i18nT('remove')}</button>
          </div>
        );
      })}

      <div className="cart-total">
        <h2>{i18nT('total')}: ${cartTotal.toFixed(2)}</h2>
        <button className="place-order-btn" onClick={handlePlaceOrder}>
          {i18nT('placeOrder')}
        </button>
      </div>
    </div>
  );
}