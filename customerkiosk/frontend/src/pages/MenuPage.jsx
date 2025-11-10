import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';

export default function MenuPage() {
  const [drinks, setDrinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { cart } = useApp();

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

  if (drinks.length === 0) {
    return <div className="loading">No drinks available</div>;
  }

  return (
    <div className="menu-page">
      <h1>{t('menu')}</h1>
      
      <div className="drink-grid">
        {drinks.map(drink => {
          const productId = drink.product_id || drink.item_id;
          return (
            <div 
              key={productId} 
              className="drink-card"
              onClick={() => navigate(`/customize/${productId}`)}
            >
              <div className="drink-image-placeholder">🧋</div>
              <h3>{drink.name}</h3>
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
          {t('cart')} ({cart.length})
        </button>
      )}
    </div>
  );
}