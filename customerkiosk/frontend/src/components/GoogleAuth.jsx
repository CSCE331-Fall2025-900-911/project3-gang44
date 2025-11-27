import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useApp } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function GoogleAuth() {
  const { setUser } = useApp();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSuccess = async (credentialResponse) => {
    console.log("Google login successful, credential received");
    try {
      console.log(
        "Sending request to:",
        `${import.meta.env.VITE_API_URL}/api/auth/google`
      );
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/google`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: credentialResponse.credential }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Auth response:", data);
      setUser(data);
      navigate("/menu");
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed: " + error.message);
    }
  };

  const handleError = () => {
    console.error("Google Login Failed");
    alert("Google login failed. Please try again.");
  };

  const handleSkipLogin = () => {
    // Set a guest user and navigate to menu
    setUser({
      email: 'guest@example.com',
      name: 'Guest User',
      picture: null
    });
    navigate("/menu");
  };

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <div className="auth-container">
        <h1>{t("welcome")}</h1>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          size="large"
        />
        <button 
          onClick={handleSkipLogin}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            backgroundColor: '#f0f0f0',
            border: '1px solid #ccc',
            borderRadius: '5px'
          }}
        >
          Skip Login (Continue as Guest)
        </button>
      </div>
    </GoogleOAuthProvider>
  );
}
