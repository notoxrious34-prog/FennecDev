-- Fennec Facturation v3.0 Database Schema
-- Canonical schema file for La Vie En Rose 34 ERP System

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('individual', 'company')),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  email TEXT,
  nif TEXT,
  nis TEXT,
  rc TEXT,
  ai TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL NOT NULL CHECK(price >= 0),
  category TEXT NOT NULL CHECK(category IN ('product', 'service', 'commodity')),
  unit TEXT,
  stock_quantity INTEGER DEFAULT 0 CHECK(stock_quantity >= 0),
  low_stock_threshold INTEGER DEFAULT 5 CHECK(low_stock_threshold >= 0),
  cost_price REAL DEFAULT 0 CHECK(cost_price >= 0),
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  client_id TEXT NOT NULL,
  date TEXT NOT NULL,
  due_date TEXT,
  subtotal REAL NOT NULL CHECK(subtotal >= 0),
  tax REAL DEFAULT 0 CHECK(tax >= 0),
  stamp_duty INTEGER DEFAULT 0,
  discount REAL DEFAULT 0 CHECK(discount >= 0),
  total REAL NOT NULL CHECK(total >= 0),
  status TEXT NOT NULL CHECK(status IN ('paid', 'unpaid', 'partial')),
  notes TEXT,
  payment_method TEXT CHECK(payment_method IN ('cash', 'check', 'transfer', 'other')),
  document_type TEXT CHECK(document_type IN ('invoice', 'receipt', 'both')),
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idxinvoices_number ON invoices(number);
CREATE INDEX IF NOT EXISTS idxinvoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idxinvoices_date ON invoices(date);
CREATE INDEX IF NOT EXISTS idxinvoices_status ON invoices(status);

-- Invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  product_id TEXT,
  name TEXT NOT NULL,
  quantity REAL NOT NULL CHECK(quantity > 0),
  price REAL NOT NULL CHECK(price >= 0),
  total REAL NOT NULL CHECK(total >= 0),
  unit TEXT,
  width REAL,
  height REAL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product_id ON invoice_items(product_id);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  name TEXT NOT NULL DEFAULT 'محلي التجاري',
  address TEXT NOT NULL DEFAULT 'الجزائر العاصمة',
  phone TEXT NOT NULL DEFAULT '0555000000',
  email TEXT NOT NULL DEFAULT 'contact@store.dz',
  tax_rate REAL DEFAULT 19 CHECK(tax_rate >= 0),
  currency TEXT DEFAULT 'د.ج',
  nif TEXT,
  nis TEXT,
  rc TEXT,
  ai TEXT,
  bank_account TEXT,
  language TEXT DEFAULT 'ar' CHECK(language IN ('ar', 'fr', 'en')),
  theme TEXT DEFAULT 'light' CHECK(theme IN ('light', 'dark', 'mica-light', 'mica-dark')),
  accent_color TEXT DEFAULT 'blue' CHECK(accent_color IN ('blue', 'purple', 'emerald', 'orange', 'rose'))
);

-- Insert default settings row
INSERT OR IGNORE INTO settings (id) VALUES (1);
