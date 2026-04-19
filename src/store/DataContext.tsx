import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { Client, Product, Invoice } from '../types';

interface DataContextType {
  clients: Client[];
  products: Product[];
  invoices: Invoice[];
  isLoading: boolean;
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  refreshClients: () => Promise<void>;
  refreshProducts: () => Promise<void>;
  refreshInvoices: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshClients = useCallback(async () => {
    const res = await window.api.client.getAll();
    if (res.success && res.data) setClients(res.data);
  }, []);

  const refreshProducts = useCallback(async () => {
    const res = await window.api.product.getAll();
    if (res.success && res.data) setProducts(res.data);
  }, []);

  const refreshInvoices = useCallback(async () => {
    const res = await window.api.invoice.getAll();
    if (res.success && res.data) setInvoices(res.data);
  }, []);

  // Load initial data
  React.useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
      try {
        await Promise.all([
          refreshClients(),
          refreshProducts(),
          refreshInvoices()
        ]);
      } catch (error) {
        console.error('Failed to load initial data', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, [refreshClients, refreshProducts, refreshInvoices]);

  const value = useMemo(() => ({
    clients, products, invoices, isLoading,
    setClients, setProducts, setInvoices,
    refreshClients, refreshProducts, refreshInvoices
  }), [clients, products, invoices, isLoading, setClients, setProducts, setInvoices, refreshClients, refreshProducts, refreshInvoices]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
