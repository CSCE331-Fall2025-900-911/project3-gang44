import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { useEffect, useState, useRef } from 'react';

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const { language, setLanguageChoice } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'zh', name: '中文', flag: '🇨🇳' }
  ];

  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLanguageChange = (langCode) => {
    setLanguageChoice(langCode);
    setIsOpen(false);
  };

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

  return (
    <div className="language-toggle-dropdown" ref={dropdownRef}>
      <button
        className="language-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select language"
      >
        <span className="language-flag">{currentLanguage.flag}</span>
        <span className="language-name">{currentLanguage.name}</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="language-dropdown-menu">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`language-option ${language === lang.code ? 'active' : ''}`}
              onClick={() => handleLanguageChange(lang.code)}
            >
              <span className="language-flag">{lang.flag}</span>
              <span className="language-name">{lang.name}</span>
              {language === lang.code && <span className="checkmark">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}