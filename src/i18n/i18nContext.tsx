import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { translations, Language } from './translations';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
  dir: 'ltr' | 'rtl';
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (num: number) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const DEFAULT_LANGUAGE: Language = 'ar';

const localeMap: Record<Language, string> = {
  ar: 'ar-DZ',
  fr: 'fr-DZ',
  en: 'en-US',
};

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Try to load from localStorage
    const saved = localStorage.getItem('app-language') as Language;
    if (saved && (saved === 'ar' || saved === 'fr' || saved === 'en')) {
      return saved;
    }
    return DEFAULT_LANGUAGE;
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app-language', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, []);

  // Set initial dir
  React.useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let text = translations[language][key as keyof typeof translations['ar']] || 
                translations['ar'][key as keyof typeof translations['ar']] || 
                key;
    
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    
    return text;
  }, [language]);

  const isRTL = language === 'ar';
  const dir = isRTL ? 'rtl' : 'ltr';

  const formatCurrency = useCallback((amount: number): string => {
    const locale = localeMap[language];
    const currency = 'DZD'; // Default, could be from settings
    
    try {
      return new Intl.NumberFormat(locale, { 
        style: 'currency', 
        currency: 'DZD' 
      }).format(amount);
    } catch (e) {
      return `${amount} ${currency}`;
    }
  }, [language]);

  const formatDate = useCallback((date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
    const locale = localeMap[language];
    const defaultOptions: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    try {
      return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options })
        .format(new Date(date));
    } catch (e) {
      return String(date);
    }
  }, [language]);

  const formatNumber = useCallback((num: number): string => {
    const locale = localeMap[language];
    
    try {
      return new Intl.NumberFormat(locale).format(num);
    } catch (e) {
      return String(num);
    }
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
    isRTL,
    dir,
    formatCurrency,
    formatDate,
    formatNumber,
  }), [language, setLanguage, t, isRTL, dir, formatCurrency, formatDate, formatNumber]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
