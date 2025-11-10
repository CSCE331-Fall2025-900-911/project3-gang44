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
      <p>Order #{orderId}</p>
      <button onClick={() => navigate('/menu')}>
        {t('orderAgain')}
      </button>
    </div>
  );
}