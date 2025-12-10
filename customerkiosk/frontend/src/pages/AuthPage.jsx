import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useApp } from "../context/AppContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./AuthPage.css";

export default function AuthPage() {
  const { setUser } = useApp();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role"); // "cashier" or "manager"

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

      // Navigate based on role
      if (role === "cashier") {
        navigate("/cashier");
      } else if (role === "manager") {
        navigate("/manager");
      } else {
        // Fallback to menu if role is not specified
        navigate("/menu");
      }
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed: " + error.message);
    }
  };

  const handleError = () => {
    console.error("Google Login Failed");
    alert("Google login failed. Please try again.");
  };

  const handleCancel = () => {
    navigate("/");
  };

  // Determine the title based on role
  const getTitle = () => {
    if (role === "cashier") {
      return t("Cashier Mode - Authentication Required");
    } else if (role === "manager") {
      return t("Manager Mode - Authentication Required");
    }
    return t("Staff Authentication Required");
  };

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <div className="auth-page-container">
        <div className="auth-card">
          <h1>{getTitle()}</h1>
          <p className="auth-subtitle">
            {t("Please sign in with your staff account to continue")}
          </p>

          <div className="auth-content">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={handleError}
              size="large"
              locale={i18n.language}
            />
            <p className="google-signin-label">
              {t("Use your staff Google account")}
            </p>
          </div>

          <button className="cancel-button" onClick={handleCancel}>
            {t("Cancel")}
          </button>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
