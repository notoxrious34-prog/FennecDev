import React, { ReactNode } from 'react';
import { Client, Product, Invoice, StoreSettings } from '../types';
import { DataProvider, useData } from './DataContext';
import { ActionsProvider, useActions } from './ActionsContext';
import { SettingsProvider, useSettings } from './SettingsContext';

// Type declaration for window.api
declare global {
  interface Window {
    api: {
      client: {
        getAll: () => Promise<{ success: boolean; data?: Client[]; error?: any }>;
        getById: (id: string) => Promise<{ success: boolean; data?: Client; error?: any }>;
        create: (data: Omit<Client, 'id'>) => Promise<{ success: boolean; data?: Client; error?: any }>;
        update: (id: string, data: Omit<Client, 'id'>) => Promise<{ success: boolean; data?: Client; error?: any }>;
        delete: (id: string) => Promise<{ success: boolean; data?: any; error?: any }>;
        search: (query: string) => Promise<{ success: boolean; data?: Client[]; error?: any }>;
      };
      product: {
        getAll: () => Promise<{ success: boolean; data?: Product[]; error?: any }>;
        getById: (id: string) => Promise<{ success: boolean; data?: Product; error?: any }>;
        create: (data: Omit<Product, 'id'>) => Promise<{ success: boolean; data?: Product; error?: any }>;
        update: (id: string, data: Omit<Product, 'id'>) => Promise<{ success: boolean; data?: Product; error?: any }>;
        delete: (id: string) => Promise<{ success: boolean; data?: any; error?: any }>;
        search: (query: string) => Promise<{ success: boolean; data?: Product[]; error?: any }>;
      };
      invoice: {
        getAll: () => Promise<{ success: boolean; data?: Invoice[]; error?: any }>;
        getById: (id: string) => Promise<{ success: boolean; data?: Invoice; error?: any }>;
        create: (data: Omit<Invoice, 'id'>) => Promise<{ success: boolean; data?: Invoice; error?: any }>;
        update: (id: string, data: Omit<Invoice, 'id'>) => Promise<{ success: boolean; data?: Invoice; error?: any }>;
        delete: (id: string) => Promise<{ success: boolean; data?: any; error?: any }>;
        updateStatus: (id: string, status: Invoice['status']) => Promise<{ success: boolean; data?: Invoice; error?: any }>;
      };
      settings: {
        get: () => Promise<{ success: boolean; data?: StoreSettings; error?: any }>;
        update: (data: StoreSettings) => Promise<{ success: boolean; data?: StoreSettings; error?: any }>;
      };
      license: {
        activate: (licenseToken: string) => Promise<{ success: boolean; data?: any; error?: any }>;
        checkStatus: () => Promise<{ success: boolean; data?: any; error?: any }>;
        getDetails: () => Promise<{ success: boolean; data?: any; error?: any }>;
        getMachineId: () => Promise<{ success: boolean; machineId?: string; error?: any }>;
      };
      backup: {
        create: () => Promise<{ success: boolean; path?: string; filename?: string; error?: any }>;
        getAll: () => Promise<{ success: boolean; data?: any[]; error?: any }>;
        delete: (filename: string) => Promise<{ success: boolean; error?: any }>;
        restore: (filename: string) => Promise<{ success: boolean; error?: any }>;
        getStats: () => Promise<{ success: boolean; data?: any; error?: any }>;
        prune: () => Promise<{ success: boolean; deletedCount?: number; error?: any }>;
      };
      audit: {
        getRecent: (limit: number) => Promise<{ success: boolean; data?: any[]; error?: any }>;
        getByEntity: (entity: string, entityId: string) => Promise<{ success: boolean; data?: any[]; error?: any }>;
        getByDateRange: (startDate: string, endDate: string) => Promise<{ success: boolean; data?: any[]; error?: any }>;
      };
    };
  }
}

// Combined provider for backward compatibility
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <SettingsProvider>
      <DataProvider>
        <ActionsProvider>
          {children}
        </ActionsProvider>
      </DataProvider>
    </SettingsProvider>
  );
};

// Backward compatible hook that combines all contexts
export const useAppContext = () => {
  const data = useData();
  const actions = useActions();
  const { settings, updateSettings, refreshSettings } = useSettings();
  
  return {
    ...data,
    settings,
    updateSettings,
    refreshSettings,
    ...actions
  };
};
