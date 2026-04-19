import { useAppContext } from '../store/AppContext';
import { translations, Language } from './translations';

export const useTranslation = () => {
  const { settings } = useAppContext();
  const lang = (settings.language as Language) || 'ar';
  
  const t = (key: keyof typeof translations['ar'], params?: Record<string, string>) => {
    let text = translations[lang][key] || translations['ar'][key] || key;
    
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
    }
    
    return text;
  };

  const isRTL = lang === 'ar';

  const formatCurrency = (amount: number) => {
    const locales = {
      ar: 'ar-DZ',
      fr: 'fr-DZ',
      en: 'en-US'
    };
    const locale = locales[lang] || 'ar-DZ';
    
    const currency = settings?.currency || 'د.ج';
    const isDefaultDZD = currency === 'DZD' || currency === 'د.ج';
    const isKnownCurrency = ['USD', 'EUR', 'MAD', 'TND'].includes(currency.toUpperCase());
    
    try {
      if (isDefaultDZD) {
        return new Intl.NumberFormat(locale, { style: 'currency', currency: 'DZD' }).format(amount);
      } else if (isKnownCurrency) {
        return new Intl.NumberFormat(locale, { style: 'currency', currency: currency.toUpperCase() }).format(amount);
      } else {
        // Fallback for custom currencies: format as DZD then replace the symbol
        const formatted = new Intl.NumberFormat(locale, { style: 'currency', currency: 'DZD' }).format(amount);
        return formatted.replace(/DZD|د\.ج\.?/g, currency);
      }
    } catch (e) {
      return `${amount} ${currency}`;
    }
  };

  return { t, lang, isRTL, formatCurrency };
};
