import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import GoogleAuth from './components/GoogleAuth';
import MenuPage from './pages/MenuPage';
import CustomizePage from './pages/CustomizePage';
import CartPage from './pages/CartPage';
import ConfirmationPage from './pages/ConfirmationPage';
import LanguageToggle from './components/LanguageToggle';
import TranslationLoader from './components/TranslationLoader';
import './i18n/i18n';
import './App.css';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="app">
          <LanguageToggle />
          <TranslationLoader />
          <Routes>
            <Route path="/" element={<GoogleAuth />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/customize/:id" element={<CustomizePage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/confirmation" element={<ConfirmationPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;