import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { useWeatherRecommendation } from '../components/weather';

export default function CartPage() {
  const navigate = useNavigate();
  const { t: i18nT } = useTranslation();
  const { cart, removeFromCart, cartTotal, clearCart, user, t } = useApp();
  const { recommendation, loading } = useWeatherRecommendation();

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
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🥤</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{i18nT('emptyCart')}</h2>
            
            {!loading && recommendation && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6 border border-purple-200">
                <div className="text-3xl mb-2">{recommendation.emoji}</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Try: {t(recommendation.drink)}
                </h3>
                <p className="text-gray-600 text-sm">{recommendation.reason}</p>
              </div>
            )}
            
            <button 
              className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-shadow"
              onClick={() => navigate('/menu')}
            >
              {i18nT('backToMenu')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button className="back-button" onClick={() => navigate('/menu')}>
            ← {i18nT('backToMenu')}
          </button>
          <h1 className="text-4xl font-bold text-gray-800 text-center flex-1">{i18nT('cart')}</h1>
          <div className="w-24"></div>
        </div>

        {!loading && recommendation && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 mb-6 text-white shadow-lg">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-4">
                <div className="text-5xl">{recommendation.emoji}</div>
                <div>
                  <h3 className="text-xl font-bold mb-1">
                    Try this: {t(recommendation.drink)}
                  </h3>
                  <p className="text-blue-100">{recommendation.reason}</p>
                </div>
              </div>
              <button
                className="bg-white text-purple-600 px-6 py-2 rounded-full font-semibold hover:bg-blue-50 transition-colors"
                onClick={() => navigate('/menu')}
              >
                Add to Order
              </button>
            </div>
<<<<<<< HEAD
=======
    <div className="cart-page">
      <div className="cart-header">
        <button className="back-button" onClick={() => navigate('/menu')}>
          ← {i18nT('backToMenu')}
        </button>
        <h1>{i18nT('cart')}</h1>
      </div>

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
>>>>>>> daac88521ab35a832fba09ad5977b43d91a7b34f
          </div>
        )}

        <div className="space-y-4 mb-8">
          {cart.map(item => {
            const translatedToppings = item.toppings.map(topping => t(topping.name)).join(', ');

            return (
              <div key={item.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{t(item.name)}</h3>
                    <div className="space-y-1 text-gray-600">
                      <p>{i18nT('size')}: {t(item.size)}</p>
                      <p>{i18nT('ice')}: {t(item.iceLevel)}</p>
                      <p>{i18nT('sweetness')}: {t(item.sweetnessLevel)}</p>
                      {item.toppings.length > 0 && (
                        <p>{i18nT('toppings')}: {translatedToppings}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-purple-600 mb-3">
                      ${item.price.toFixed(2)}
                    </p>
                    <button
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                      onClick={() => removeFromCart(item.id)}
                    >
                      {i18nT('remove')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <span className="text-2xl font-bold text-gray-800">{i18nT('total')}:</span>
            <span className="text-3xl font-bold text-purple-600">${cartTotal.toFixed(2)}</span>
          </div>
          <button
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 rounded-xl text-xl font-bold hover:shadow-xl transition-shadow"
            onClick={handlePlaceOrder}
          >
            {i18nT('placeOrder')}
          </button>
        </div>
      </div>
    </div>
  );
}
