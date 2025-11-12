import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { useEffect } from 'react';

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const { language, toggleLanguage } = useApp();

useEffect(() => {
  if (i18n.language !== language) {
    i18n.changeLanguage(language);
  }
}, [language, i18n]);

  return (
    <button className="language-toggle" onClick={toggleLanguage}>
      {language === 'en' ? 'Español' : 'English'}
    </button>
  );
}