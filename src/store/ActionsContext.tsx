import React, { createContext, useContext, useCallback, useMemo, ReactNode } from 'react';
import { Client, Product, Invoice, StoreSettings } from '../types';
import { useData } from './DataContext';

interface ActionsContextType {
  addClient: (client: Omit<Client, 'id'>) => Promise<string>;
  updateClient: (id: string, client: Omit<Client, 'id'>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  
  addProduct: (product: Omit<Product, 'id'>) => Promise<string>;
  updateProduct: (id: string, product: Omit<Product, 'id'>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  addInvoice: (invoice: Omit<Invoice, 'id'>) => Promise<void>;
  updateInvoice: (id: string, invoice: Omit<Invoice, 'id'>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => Promise<void>;
  
  updateSettings: (settings: StoreSettings) => Promise<void>;
  exportBackup: () => string;
  loadBackup: (jsonString: string) => Promise<boolean>;
}

const ActionsContext = createContext<ActionsContextType | undefined>(undefined);

export const ActionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { clients, setClients, products, setProducts, invoices, setInvoices, refreshClients, refreshProducts, refreshInvoices } = useData();

  const addClient = useCallback(async (client: Omit<Client, 'id'>) => {
    const res = await window.api.client.create(client);
    if (res.success && res.data) {
      setClients([...clients, res.data]);
      return res.data.id;
    }
    throw new Error(res.error?.message || 'Failed to create client');
  }, [clients, setClients]);

  const updateClient = useCallback(async (id: string, updatedClient: Omit<Client, 'id'>) => {
    const res = await window.api.client.update(id, updatedClient);
    if (res.success && res.data) {
      setClients(clients.map(c => c.id === id ? res.data! : c));
    }
  }, [clients, setClients]);

  const deleteClient = useCallback(async (id: string) => {
    const res = await window.api.client.delete(id);
    if (res.success) {
      setClients(clients.filter(c => c.id !== id));
    }
  }, [clients, setClients]);

  const addProduct = useCallback(async (product: Omit<Product, 'id'>) => {
    const res = await window.api.product.create(product);
    if (res.success && res.data) {
      setProducts([...products, res.data]);
      return res.data.id;
    }
    throw new Error(res.error?.message || 'Failed to create product');
  }, [products, setProducts]);

  const updateProduct = useCallback(async (id: string, updatedProduct: Omit<Product, 'id'>) => {
    const res = await window.api.product.update(id, updatedProduct);
    if (res.success && res.data) {
      setProducts(products.map(p => p.id === id ? res.data! : p));
    }
  }, [products, setProducts]);

  const deleteProduct = useCallback(async (id: string) => {
    const res = await window.api.product.delete(id);
    if (res.success) {
      setProducts(products.filter(p => p.id !== id));
    }
  }, [products, setProducts]);

  const addInvoice = useCallback(async (invoice: Omit<Invoice, 'id'>) => {
    const res = await window.api.invoice.create(invoice);
    if (res.success && res.data) {
      setInvoices([...invoices, res.data]);
    }
  }, [invoices, setInvoices]);

  const updateInvoice = useCallback(async (id: string, updatedInvoice: Omit<Invoice, 'id'>) => {
    const res = await window.api.invoice.update(id, updatedInvoice);
    if (res.success && res.data) {
      setInvoices(invoices.map(i => i.id === id ? res.data! : i));
    }
  }, [invoices, setInvoices]);

  const deleteInvoice = useCallback(async (id: string) => {
    const res = await window.api.invoice.delete(id);
    if (res.success) {
      setInvoices(invoices.filter(i => i.id !== id));
    }
  }, [invoices, setInvoices]);

  const updateInvoiceStatus = useCallback(async (id: string, status: Invoice['status']) => {
    const res = await window.api.invoice.updateStatus(id, status);
    if (res.success && res.data) {
      setInvoices(invoices.map(i => i.id === id ? res.data! : i));
    }
  }, [invoices, setInvoices]);

  const updateSettings = useCallback(async (newSettings: StoreSettings) => {
    const res = await window.api.settings.update(newSettings);
    if (res.success && res.data) {
      // Settings are managed separately
    }
  }, []);

  const exportBackup = useCallback(() => {
    const data = {
      clients,
      products,
      invoices,
      version: '1.0',
      timestamp: new Date().toISOString()
    };
    return JSON.stringify(data);
  }, [clients, products, invoices]);

  const loadBackup = useCallback(async (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      
      // Clear existing data
      await Promise.all([
        ...clients.map(c => window.api.client.delete(c.id)),
        ...products.map(p => window.api.product.delete(p.id)),
        ...invoices.map(i => window.api.invoice.delete(i.id))
      ]);

      // Import new data
      if (data.clients) {
        for (const client of data.clients) {
          await window.api.client.create(client);
        }
      }
      if (data.products) {
        for (const product of data.products) {
          await window.api.product.create(product);
        }
      }
      if (data.invoices) {
        for (const invoice of data.invoices) {
          await window.api.invoice.create(invoice);
        }
      }

      // Refresh all data
      await Promise.all([refreshClients(), refreshProducts(), refreshInvoices()]);
      
      return true;
    } catch (e) {
      console.error('Failed to load backup', e);
      return false;
    }
  }, [clients, products, invoices, refreshClients, refreshProducts, refreshInvoices]);

  const value = useMemo(() => ({
    addClient, updateClient, deleteClient,
    addProduct, updateProduct, deleteProduct,
    addInvoice, updateInvoice, deleteInvoice, updateInvoiceStatus,
    updateSettings, exportBackup, loadBackup
  }), [
    addClient, updateClient, deleteClient,
    addProduct, updateProduct, deleteProduct,
    addInvoice, updateInvoice, deleteInvoice, updateInvoiceStatus,
    updateSettings, exportBackup, loadBackup
  ]);

  return (
    <ActionsContext.Provider value={value}>
      {children}
    </ActionsContext.Provider>
  );
};

export const useActions = () => {
  const context = useContext(ActionsContext);
  if (context === undefined) {
    throw new Error('useActions must be used within an ActionsProvider');
  }
  return context;
};
