import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { useWeather, getDrinkRecommendation } from '../components/weather';

export default function CartPage() {
  const navigate = useNavigate();
  const { t: i18nT } = useTranslation();
  const { cart, removeFromCart, cartTotal, clearCart, user, t } = useApp();
  const { weather, loading } = useWeather();
  const recommendation = weather ? getDrinkRecommendation(weather.temperature, weather.weatherCode) : null;

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
        {!loading && recommendation && (
          <div style={{
            background: 'linear-gradient(to right, #e3f2fd, #f3e5f5)',
            padding: '20px',
            borderRadius: '12px',
            margin: '20px auto',
            maxWidth: '500px',
            border: '2px solid #333'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>{recommendation.emoji}</div>
              <h3 style={{ fontSize: '20px', marginBottom: '10px', color: '#333' }}>
                Try: {t(recommendation.name)}
              </h3>
              <p style={{ fontSize: '14px', color: '#666' }}>{recommendation.reason}</p>
          </div>
        )}
        <button onClick={() => navigate('/menu')}>{i18nT('backToMenu')}</button>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-header">
        <button className="back-button" onClick={() => navigate('/menu')}>
          ← {i18nT('backToMenu')}
        </button>
        <h1>{i18nT('cart')}</h1>
      </div>

      {!loading && recommendation && (
        <div style={{
          background: 'linear-gradient(to right, #4fc3f7, #ba68c8)',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px',
          color: 'white',
          border: '2px solid #333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ fontSize: '50px' }}>{recommendation.emoji}</div>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '5px' }}>
                Try this: {t(recommendation.name)}
              </h3>
              <p style={{ fontSize: '14px', color: '#e3f2fd' }}>{recommendation.reason}</p>
            </div>
          </div>
          <button
            style={{
              background: 'white',
              color: '#ba68c8',
              padding: '10px 20px',
              border: '2px solid #333',
              borderRadius: '20px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/menu')}
          >
            Add to Order
          </button>
        </div>
      )}

      {cart.map(item => {
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
