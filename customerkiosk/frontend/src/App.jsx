import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import RoleSelectionPage from "./pages/RoleSelectionPage";
import AuthPage from "./pages/AuthPage";
import MenuPage from "./pages/MenuPage";
import CustomizePage from "./pages/CustomizePage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import ConfirmationPage from "./pages/ConfirmationPage";
import CashierPage from "./pages/CashierPage";
import ManagerPage from "./pages/ManagerPage";
import LanguageToggle from "./components/LanguageToggle";
import TranslationLoader from "./components/TranslationLoader";
import TextSizeAdjuster from "./components/TextSizeAdjuster";
import HighContrastToggle from "./components/HighContrastToggle";
import "./i18n/i18n";
import "./App.css";

function App() {
  return (
    // wraps the whole app so context and router work everywhere
    <AppProvider>
      <BrowserRouter>
        <div className="app">
          {/* top bar buttons for language + accessibility */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              marginBottom: "10px",
              padding: "10px",
            }}
          >
            {/* change language */}
            <LanguageToggle />

            {/* adjust text size */}
            <TextSizeAdjuster />

            {/* high contrast toggle */}
            <HighContrastToggle />

            {/* text reader removed */}
          </div>

          {/* loads translations when language changes */}
          <TranslationLoader />

          {/* routes for all the pages */}
          <Routes>
            <Route path="/" element={<RoleSelectionPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/customize/:id" element={<CustomizePage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/confirmation" element={<ConfirmationPage />} />
            <Route path="/cashier" element={<CashierPage />} />
            <Route path="/manager" element={<ManagerPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
