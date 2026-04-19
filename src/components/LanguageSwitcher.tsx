import React from 'react';
import { useI18n } from '../i18n/i18nContext';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
  const { language, setLanguage } = useI18n();

  const languages = [
    { code: 'ar', name: 'العربية', flag: '🇩🇿' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
  ];

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">
        <Globe size={18} className="text-slate-500" />
        <span className="text-sm font-medium text-slate-700">
          {languages.find(l => l.code === language)?.flag} {language.toUpperCase()}
        </span>
      </button>
      
      <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-lg border border-slate-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[150px]">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code as any)}
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
              language === lang.code
                ? 'bg-accent-50 text-accent-700'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>{lang.flag}</span>
            <span>{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitcher;
