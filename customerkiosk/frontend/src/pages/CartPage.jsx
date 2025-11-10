import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';

export default function CartPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { cart, removeFromCart, cartTotal, clearCart, user } = useApp();

  const handlePlaceOrder = async () => {
    try {
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
      clearCart();
      navigate('/confirmation', { state: { orderId: data.orderId } });
    } catch (error) {
      console.error('Order failed:', error);
      alert('Order failed. Please try again.');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="empty-cart">
        <h2>{t('emptyCart')}</h2>
        <button onClick={() => navigate('/menu')}>{t('backToMenu')}</button>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>{t('cart')}</h1>
      
      {cart.map(item => (
        <div key={item.id} className="cart-item">
          <h3>🧋 {item.name}</h3>
          <p><strong>{t('size')}:</strong> {item.size}</p>
          <p><strong>{t('ice')}:</strong> {item.iceLevel}</p>
          <p><strong>{t('sweetness')}:</strong> {item.sweetnessLevel}</p>
          {item.toppings.length > 0 && (
            <p><strong>{t('toppings')}:</strong> {item.toppings.map(t => t.name).join(', ')}</p>
          )}
          <p className="price">${item.price.toFixed(2)}</p>
          <button onClick={() => removeFromCart(item.id)}>{t('remove')}</button>
        </div>
      ))}

      <div className="cart-total">
        <h2>{t('total')}: ${cartTotal.toFixed(2)}</h2>
        <button className="place-order-btn" onClick={handlePlaceOrder}>
          {t('placeOrder')}
        </button>
      </div>
    </div>
  );
}