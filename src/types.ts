export interface Client {
  id: string;
  type: 'individual' | 'company';
  name: string;
  phone: string;
  address: string;
  email?: string;
  nif?: string; // Numéro d'Identification Fiscale
  nis?: string; // Numéro d'Identification Statistique
  rc?: string;  // Registre de Commerce
  ai?: string;  // Article d'Imposition
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'product' | 'service' | 'commodity';
  unit?: string;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  unit?: string;
  width?: number;
  height?: number;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  date: string;
  dueDate?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number; // percentage
  stampDuty?: boolean; // 1% stamp duty
  discount: number; // fixed amount
  total: number;
  status: 'paid' | 'unpaid' | 'partial';
  notes: string;
  paymentMethod?: 'cash' | 'check' | 'transfer' | 'other';
  documentType?: 'invoice' | 'receipt' | 'both';
}

export interface StoreSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxRate: number;
  currency: string;
  nif?: string;
  nis?: string;
  rc?: string;
  ai?: string;
  bankAccount?: string;
  language?: 'ar' | 'fr' | 'en';
  theme?: 'light' | 'dark' | 'mica-light' | 'mica-dark';
  accentColor?: 'blue' | 'purple' | 'emerald' | 'orange' | 'rose';
}
