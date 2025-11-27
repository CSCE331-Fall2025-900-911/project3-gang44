import Weather from './components/weather';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import GoogleAuth from "./components/GoogleAuth";
import MenuPage from "./pages/MenuPage";
import CustomizePage from "./pages/CustomizePage";
import CartPage from "./pages/CartPage";
import ConfirmationPage from "./pages/ConfirmationPage";
import CashierPage from "./pages/CashierPage";
import ManagerPage from "./pages/ManagerPage";
import LanguageToggle from "./components/LanguageToggle";
import TranslationLoader from "./components/TranslationLoader";
import TextSizeAdjuster from "./components/TextSizeAdjuster";
import TextReaderButton from "./components/TextReaderButton";
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

            {/* text reader */}
            <TextReaderButton />
          </div>

          {/* loads translations when language changes */}
          <TranslationLoader />

          {/* routes for all the pages */}
          <Routes>
            <Route path="/" element={<GoogleAuth />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/customize/:id" element={<CustomizePage />} />
            <Route path="/cart" element={<CartPage />} />
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
