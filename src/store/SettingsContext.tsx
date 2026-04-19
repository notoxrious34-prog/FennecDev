import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { StoreSettings } from '../types';

const defaultSettings: StoreSettings = {
  name: 'محلي التجاري',
  address: 'الجزائر العاصمة',
  phone: '0555000000',
  email: 'contact@store.dz',
  taxRate: 19,
  currency: 'د.ج',
  nif: '',
  nis: '',
  rc: '',
  ai: '',
  bankAccount: '',
  language: 'ar',
  theme: 'light',
  accentColor: 'blue'
};

interface SettingsContextType {
  settings: StoreSettings;
  updateSettings: (settings: StoreSettings) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);

  const refreshSettings = useCallback(async () => {
    const res = await window.api.settings.get();
    if (res.success && res.data) setSettings(res.data);
  }, []);

  const updateSettings = useCallback(async (newSettings: StoreSettings) => {
    const res = await window.api.settings.update(newSettings);
    if (res.success && res.data) {
      setSettings(res.data);
    }
  }, []);

  // Load initial settings
  React.useEffect(() => {
    let cancelled = false;

    refreshSettings();

    return () => {
      cancelled = true;
    };
  }, [refreshSettings]);

  const value = useMemo(() => ({
    settings,
    updateSettings,
    refreshSettings
  }), [settings, updateSettings, refreshSettings]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
