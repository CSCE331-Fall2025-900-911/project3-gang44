import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function ConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { orderId } = location.state || {};

  return (
    <div className="confirmation-page">
      <h1>✅ {t('orderConfirmed')}</h1>
      <div style={{
        fontSize: '48px',
        fontWeight: 'bold',
        color: '#4caf50',
        margin: '20px 0',
        padding: '20px',
        background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
        borderRadius: '12px',
        border: '3px solid #4caf50'
      }}>
        Order #{orderId}
      </div>
      <p style={{ fontSize: '18px', color: '#666', marginBottom: '30px' }}>
        Please show this number at the counter
      </p>
      <button onClick={() => navigate('/menu')}>
        {t('orderAgain')}
      </button>
    </div>
  );
}