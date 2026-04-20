import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface LicenseState {
  isActivated: boolean;
  isChecking: boolean;
  licenseType: 'trial' | 'full' | null;
  isTrial: boolean;
  daysLeft: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
  isExpiringSoonCritical: boolean;
  expiresAt: string | null;
}

interface LicenseContextValue extends LicenseState {
  activate: (token: string) => Promise<{ success: boolean; error?: any }>;
  checkStatus: () => Promise<void>;
  refreshLicenseType: () => Promise<void>;
}

const LicenseContext = createContext<LicenseContextValue | undefined>(undefined);

interface LicenseProviderProps {
  children: ReactNode;
}

export const LicenseProvider: React.FC<LicenseProviderProps> = ({ children }) => {
  const [state, setState] = useState<LicenseState>({
    isActivated: false,
    isChecking: true,
    licenseType: null,
    isTrial: false,
    daysLeft: 0,
    isExpired: true,
    isExpiringSoon: false,
    isExpiringSoonCritical: false,
    expiresAt: null,
  });

  const setLicenseState = useCallback((updates: Partial<LicenseState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const refreshLicenseType = useCallback(async () => {
    try {
      if (window.api.license?.getLicenseType) {
        const typeResult = await window.api.license.getLicenseType();
        if (typeResult.success) {
          setLicenseState({
            licenseType: typeResult.data.licenseType,
            isTrial: typeResult.data.isTrial,
            daysLeft: typeResult.data.daysLeft,
            isExpired: typeResult.data.isExpired,
            isExpiringSoon: typeResult.data.isExpiringSoon,
            isExpiringSoonCritical: typeResult.data.isExpiringSoonCritical,
          });
        }
      }
    } catch (err) {
      console.warn('[LicenseContext] Failed to refresh license type:', err);
    }
  }, [setLicenseState]);

  const checkStatus = useCallback(async () => {
    try {
      if (window.api.license?.checkStatus) {
        const statusResult = await window.api.license.checkStatus();
        if (statusResult.success && statusResult.data?.valid) {
          setLicenseState({ isActivated: true });
          await refreshLicenseType();
        } else {
          setLicenseState({ isActivated: false });
        }
      } else {
        // If license API not available, allow access (dev mode)
        setLicenseState({ isActivated: true, isChecking: false });
      }
    } catch (err) {
      console.warn('[LicenseContext] Failed to check license status:', err);
      setLicenseState({ isActivated: false, isChecking: false });
    } finally {
      setLicenseState({ isChecking: false });
    }
  }, [refreshLicenseType, setLicenseState]);

  const activate = useCallback(async (token: string) => {
    try {
      if (window.api.license?.activate) {
        const result = await window.api.license.activate(token);
        if (result.success) {
          setLicenseState({ isActivated: true });
          await refreshLicenseType();
        }
        return result;
      }
      return { success: false, error: { code: 'API_UNAVAILABLE', message: 'License API not available' } };
    } catch (err) {
      console.error('[LicenseContext] Failed to activate license:', err);
      return { success: false, error: { code: 'ACTIVATION_ERROR', message: 'Failed to activate license' } };
    }
  }, [refreshLicenseType, setLicenseState]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const value: LicenseContextValue = {
    ...state,
    activate,
    checkStatus,
    refreshLicenseType,
  };

  return <LicenseContext.Provider value={value}>{children}</LicenseContext.Provider>;
};

export const useLicense = (): LicenseContextValue => {
  const context = useContext(LicenseContext);
  if (context === undefined) {
    throw new Error('useLicense must be used within a LicenseProvider');
  }
  return context;
};
