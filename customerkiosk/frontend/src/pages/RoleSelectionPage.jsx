import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./RoleSelectionPage.css";

export default function RoleSelectionPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="role-selection-container">
      <h1>{t("welcome")}</h1>
      <p className="subtitle">{t("Please select your role")}</p>

      <div className="role-buttons">
        <button
          className="role-button kiosk-button"
          onClick={() => navigate("/menu")}
        >
          <div className="button-text">
            <h2>{t("Self-Order Kiosk")}</h2>
            <p>{t("Order as a customer")}</p>
          </div>
        </button>

        <button
          className="role-button cashier-button"
          onClick={() => navigate("/auth?role=cashier")}
        >
          <div className="button-text">
            <h2>{t("Cashier Mode")}</h2>
            <p>{t("Staff authentication required")}</p>
          </div>
        </button>

        <button
          className="role-button manager-button"
          onClick={() => navigate("/auth?role=manager")}
        >
          <div className="button-text">
            <h2>{t("Manager Mode")}</h2>
            <p>{t("Staff authentication required")}</p>
          </div>
        </button>
      </div>
    </div>
  );
}
