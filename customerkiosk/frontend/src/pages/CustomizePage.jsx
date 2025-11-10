import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';

export default function CustomizePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { addToCart } = useApp();

  const [drink, setDrink] = useState(null);
  const [customizations, setCustomizations] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [size, setSize] = useState('Medium');
  const [iceLevel, setIceLevel] = useState('Regular Ice');
  const [sweetnessLevel, setSweetnessLevel] = useState('50%');
  const [selectedToppings, setSelectedToppings] = useState([]);

  useEffect(() => {
    // Fetch all drinks
    fetch(`${import.meta.env.VITE_API_URL}/api/menu`)
      .then(res => res.json())
      .then(data => {
        const foundDrink = data.find(d => d.product_id === parseInt(id));
        console.log('Found drink:', foundDrink);
        setDrink(foundDrink);
      })
      .catch(err => console.error('Error fetching drink:', err));

    // Fetch customization options
    fetch(`${import.meta.env.VITE_API_URL}/api/customizations`)
      .then(res => res.json())
      .then(data => {
        console.log('Customizations:', data);
        setCustomizations(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching customizations:', err);
        setLoading(false);
      });
  }, [id]);

  const toggleTopping = (topping) => {
    if (selectedToppings.find(t => t.id === topping.id)) {
      setSelectedToppings(selectedToppings.filter(t => t.id !== topping.id));
    } else {
      setSelectedToppings([...selectedToppings, topping]);
    }
  };

  const calculatePrice = () => {
    if (!drink) return 0;
    let price = parseFloat(drink.price);
    
    // Add size multiplier
    if (size === 'Large') price *= 1.5;
    if (size === 'Small') price *= 0.8;
    
    // Add topping prices
    selectedToppings.forEach(topping => {
      price += parseFloat(topping.price);
    });
    
    return price.toFixed(2);
  };

  const handleAddToCart = () => {
    addToCart({
      menuItemId: drink.product_id,
      name: drink.name,
      size,
      iceLevel,
      sweetnessLevel,
      toppings: selectedToppings,
      price: parseFloat(calculatePrice()),
      quantity: 1
    });
    navigate('/menu');
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!drink) return <div className="loading">Drink not found</div>;
  if (!customizations) return <div className="loading">Loading options...</div>;

  return (
    <div className="customize-page">
      <button className="back-button" onClick={() => navigate('/menu')}>
        ← {t('backToMenu')}
      </button>
      
      <h1>{t('customize')}</h1>
      <h2>🧋 {drink.name}</h2>

      <div className="customization-section">
        <h3>{t('size')}</h3>
        <div className="button-group">
          {customizations.sizes.map(s => (
            <button 
              key={s}
              className={size === s ? 'selected' : ''}
              onClick={() => setSize(s)}
            >
              {t(s.toLowerCase())}
            </button>
          ))}
        </div>
      </div>

      <div className="customization-section">
        <h3>{t('ice')}</h3>
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
        <h3>{t('sweetness')}</h3>
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
        <h3>{t('toppings')}</h3>
        <div className="button-group">
          {customizations.toppings.map(topping => (
            <button
              key={topping.id}
              className={selectedToppings.find(t => t.id === topping.id) ? 'selected' : ''}
              onClick={() => toggleTopping(topping)}
            >
              {topping.name} (+${topping.price})
            </button>
          ))}
        </div>
      </div>

      <div className="price-section">
        <h2>{t('total')}: ${calculatePrice()}</h2>
        <button className="add-to-cart-btn" onClick={handleAddToCart}>
          {t('addToCart')}
        </button>
      </div>
    </div>
  );
}