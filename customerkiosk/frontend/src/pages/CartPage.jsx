import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { useWeather, getDrinkRecommendation } from '../components/weather';

export default function CartPage() {
  const navigate = useNavigate();
  const { t: i18nT } = useTranslation(); // For UI labels
  const { cart, removeFromCart, cartTotal, clearCart, user, t } = useApp(); // For API translations
  
  // Get weather data
  const { weather, loading: weatherLoading, error: weatherError } = useWeather();
  const recommendedDrink = weather ? getDrinkRecommendation(weather.temperature, weather.weatherCode) : null;

  const handlePlaceOrder = async () => {
    try {
      console.log('Placing order with cart:', cart);
      console.log('Cart total:', cartTotal);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: cart,
          total: cartTotal,
          customerEmail: user?.email || 'guest@example.com',
          weather: weather ? {
            temperature: weather.temperature,
            condition: weather.condition
          } : null
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
      <div>
        <h2>{i18nT('emptyCart')}</h2>
        
        {/* Weather-based recommendation when cart is empty */}
        {weatherLoading && (
          <div style={{ padding: '20px', background: '#e3f2fd', margin: '20px 0', borderRadius: '8px' }}>
            <p>🌤️ Checking weather for recommendations...</p>
          </div>
        )}
        
        {weatherError && (
          <div style={{ padding: '20px', background: '#ffebee', margin: '20px 0', borderRadius: '8px', color: '#c62828' }}>
            <p>⚠️ Could not fetch weather: {weatherError}</p>
          </div>
        )}
        
        {recommendedDrink && weather && (
          <div style={{ 
            padding: '20px', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            margin: '20px 0', 
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 10px 0' }}>
              {recommendedDrink.emoji} Weather-Based Recommendation
            </h3>
            <p style={{ margin: '0 0 15px 0', fontSize: '14px', opacity: 0.9 }}>
              Current: {weather.temperature}°F - {weather.condition}
            </p>
            <div style={{ 
              background: 'rgba(255,255,255,0.95)', 
              color: '#333',
              padding: '15px', 
              borderRadius: '8px' 
            }}>
              <p style={{ fontWeight: 'bold', fontSize: '18px', margin: '0 0 5px 0' }}>
                {recommendedDrink.name}
              </p>
              <p style={{ margin: '0 0 10px 0', color: '#666' }}>
                {recommendedDrink.reason}
              </p>
              <p style={{ fontSize: '14px', margin: '0', color: '#888' }}>
                {recommendedDrink.size} • {recommendedDrink.sweetnessLevel} Sweet • {recommendedDrink.iceLevel} Ice
                {recommendedDrink.toppings.length > 0 && ` • + ${recommendedDrink.toppings.join(', ')}`}
              </p>
            </div>
          </div>
        )}

        <button onClick={() => navigate('/menu')}>{i18nT('backToMenu')}</button>
      </div>
    );
  }

  return (
    <div>
      <h1>{i18nT('cart')}</h1>
      
      {/* Weather info banner at top of cart */}
      {weather && recommendedDrink && (
        <div style={{ 
          padding: '15px', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          margin: '0 0 20px 0', 
          borderRadius: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            <p style={{ margin: '0', fontWeight: 'bold', fontSize: '16px' }}>
              🌡️ {weather.temperature}°F - {weather.condition}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '0', fontSize: '12px', opacity: 0.9 }}>Try: {recommendedDrink.name}</p>
          </div>
        </div>
      )}

      {cart.map(item => {
        const translatedToppings = item.toppings.map(topping => t(topping.name)).join(', ');

        return (
          <div key={item.id}>
            <h3>{t(item.name)}</h3>
            <p>{i18nT('size')}: {t(item.size)}</p>
            <p>{i18nT('ice')}: {t(item.iceLevel)}</p>
            <p>{i18nT('sweetness')}: {t(item.sweetnessLevel)}</p>
            {item.toppings.length > 0 && (
              <p>{i18nT('toppings')}: {translatedToppings}</p>
            )}
            <p>${item.price.toFixed(2)}</p>
            <button onClick={() => removeFromCart(item.id)}>{i18nT('remove')}</button>
          </div>
        );
      })}

      <div>
        <h2>{i18nT('total')}: ${cartTotal.toFixed(2)}</h2>
        <button onClick={handlePlaceOrder}>
          {i18nT('placeOrder')}
        </button>
      </div>
    </div>
  );
}
