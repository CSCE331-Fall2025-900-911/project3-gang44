import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function GoogleAuth() {
  const { setUser } = useApp();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSuccess = async (credentialResponse) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });
      
      const data = await response.json();
      setUser(data);
      navigate('/menu');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <div className="auth-container">
        <h1>{t('welcome')}</h1>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => console.log('Login Failed')}
          size="large"
        />
      </div>
    </GoogleOAuthProvider>
  );
}