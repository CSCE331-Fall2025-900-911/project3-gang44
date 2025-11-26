import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import GoogleAuth from './components/GoogleAuth';
import MenuPage from './pages/MenuPage';
import CustomizePage from './pages/CustomizePage';
import CartPage from './pages/CartPage';
import ConfirmationPage from './pages/ConfirmationPage';
import CashierPage from './pages/CashierPage';
import ManagerPage from './pages/ManagerPage';
import LanguageToggle from './components/LanguageToggle';
import TranslationLoader from './components/TranslationLoader';
import TextSizeAdjuster from './components/TextSizeAdjuster';
import './i18n/i18n';
import './App.css';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="app">
          <LanguageToggle />
          <div className="text-size-toggle">
            <TextSizeAdjuster />
          </div>
          <TranslationLoader />
          <Routes>
            <Route path="/" element={<GoogleAuth />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/customize/:id" element={<CustomizePage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/confirmation" element={<ConfirmationPage />} />
            <Route path="/cashier" element={<CashierPage />} />
a           <Route path="/manager" element={<ManagerPage />} />            
          </Routes>
        </div>
      </BrowserRouter>
    </AppProvider>
    
  );
}

export default App;