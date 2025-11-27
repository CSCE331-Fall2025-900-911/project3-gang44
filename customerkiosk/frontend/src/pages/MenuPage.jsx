import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { WeatherWidget } from '../components/weather';

export default function MenuPage() {
  const [drinks, setDrinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t: i18nT } = useTranslation(); // For UI labels from i18n
  const { cart, t, isTranslating } = useApp(); // For API translations of database items

  const handleWeatherDrinkClick = (productId) => {
    navigate(`/customize/${productId}`);
  };

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/menu`)
      .then(res => res.json())
      .then(data => {
        console.log('Menu data:', data);
        setDrinks(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching menu:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="loading">Loading menu...</div>;
  }

  if (isTranslating) {
    return <div className="loading">Loading translations...</div>;
  }

  if (drinks.length === 0) {
    return <div className="loading">No drinks available</div>;
  }

  return (
    <div className="menu-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div style={{ flex: '0 0 auto' }}>
          <WeatherWidget drinks={drinks} onDrinkClick={handleWeatherDrinkClick} />
        </div>
        <h1 style={{ flex: '1', textAlign: 'center', margin: 0 }}>{i18nT('menu')}</h1>
        <div style={{ flex: '0 0 auto', width: '200px' }}></div>
      </div>

      <div className="drink-grid">
        {drinks.map(drink => {
          const productId = drink.product_id || drink.item_id;
          // Translate the drink name using API translation
          const translatedName = t(drink.name);

          return (
            <div
              key={productId}
              className="drink-card"
              onClick={() => navigate(`/customize/${productId}`)}
            >
              <h3>{translatedName}</h3>
              <p>${parseFloat(drink.price).toFixed(2)}</p>
            </div>
          );
        })}
      </div>

      {cart.length > 0 && (
        <button
          className="cart-button"
          onClick={() => navigate('/cart')}
        >
          {i18nT('cart')} ({cart.length})
        </button>
      )}
    </div>
  );
}