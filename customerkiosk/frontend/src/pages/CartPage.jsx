import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';

export default function CartPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { cart, removeFromCart, cartTotal, clearCart, user } = useApp();

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
        <h2>{t('emptyCart')}</h2>
        <button onClick={() => navigate('/menu')}>{t('backToMenu')}</button>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>{t('cart')}</h1>

      {cart.map(item => {
        // Translate item name, size, ice level, and toppings
        const translatedName = t(item.name, { defaultValue: item.name });
        const translatedSize = t(item.size, { defaultValue: item.size });
        const translatedIce = t(item.iceLevel, { defaultValue: item.iceLevel });
        const translatedSweetness = t(item.sweetnessLevel, { defaultValue: item.sweetnessLevel });
        const translatedToppings = item.toppings.map(topping =>
          t(topping.name, { defaultValue: topping.name })
        ).join(', ');

        return (
          <div key={item.id} className="cart-item">
            <h3>{translatedName}</h3>
            <p><strong>{t('size')}:</strong> {translatedSize}</p>
            <p><strong>{t('ice')}:</strong> {translatedIce}</p>
            <p><strong>{t('sweetness')}:</strong> {translatedSweetness}</p>
            {item.toppings.length > 0 && (
              <p><strong>{t('toppings')}:</strong> {translatedToppings}</p>
            )}
            <p className="price">${item.price.toFixed(2)}</p>
            <button onClick={() => removeFromCart(item.id)}>{t('remove')}</button>
          </div>
        );
      })}

      <div className="cart-total">
        <h2>{t('total')}: ${cartTotal.toFixed(2)}</h2>
        <button className="place-order-btn" onClick={handlePlaceOrder}>
          {t('placeOrder')}
        </button>
      </div>
    </div>
  );
}