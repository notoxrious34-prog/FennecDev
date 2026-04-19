const { z } = require('zod');

/**
 * Zod validation schemas for all domain entities
 * Based on the existing SQLite schema
 */

const ProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  price: z.number().positive('Price must be positive'),
  category: z.enum(['product', 'service', 'commodity'], {
    errorMap: () => ({ message: 'Category must be product, service, or commodity' })
  }),
  unit: z.string().max(50).optional(),
  stockQuantity: z.number().int().nonnegative('Stock cannot be negative').default(0),
  lowStockThreshold: z.number().int().nonnegative().default(5),
  costPrice: z.number().nonnegative('Cost price must be non-negative').optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().default(true)
});

const ClientSchema = z.object({
  type: z.enum(['individual', 'company'], {
    errorMap: () => ({ message: 'Type must be individual or company' })
  }),
  name: z.string().min(1, 'Client name is required').max(255),
  phone: z.string().min(1, 'Phone is required').max(50),
  address: z.string().min(1, 'Address is required').max(500),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  nif: z.string().max(50).optional(),
  nis: z.string().max(50).optional(),
  rc: z.string().max(50).optional(),
  ai: z.string().max(50).optional()
});

const InvoiceLineSchema = z.object({
  productId: z.string().optional(),
  name: z.string().min(1, 'Item name is required'),
  quantity: z.number().positive('Quantity must be positive'),
  price: z.number().positive('Price must be positive'),
  total: z.number().nonnegative('Total must be non-negative'),
  unit: z.string().max(50).optional(),
  width: z.number().optional(),
  height: z.number().optional()
});

const InvoiceSchema = z.object({
  number: z.string().min(1, 'Invoice number is required').max(100),
  clientId: z.string().min(1, 'Client ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  items: z.array(InvoiceLineSchema).min(1, 'Invoice must have at least one line item'),
  subtotal: z.number().nonnegative('Subtotal must be non-negative'),
  tax: z.number().min(0).max(100).default(0),
  stampDuty: z.boolean().default(false),
  discount: z.number().min(0).default(0),
  total: z.number().nonnegative('Total must be non-negative'),
  status: z.enum(['paid', 'unpaid', 'partial'], {
    errorMap: () => ({ message: 'Status must be paid, unpaid, or partial' })
  }).default('unpaid'),
  notes: z.string().max(1000).optional(),
  paymentMethod: z.enum(['cash', 'check', 'transfer', 'other']).optional(),
  documentType: z.enum(['invoice', 'receipt', 'both']).optional()
});

const SettingsSchema = z.object({
  name: z.string().min(1, 'Store name is required').max(255),
  address: z.string().min(1, 'Address is required').max(500),
  phone: z.string().min(1, 'Phone is required').max(50),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  taxRate: z.number().min(0).max(100).default(19),
  currency: z.string().max(10).default('د.ج'),
  nif: z.string().max(50).optional(),
  nis: z.string().max(50).optional(),
  rc: z.string().max(50).optional(),
  ai: z.string().max(50).optional(),
  bankAccount: z.string().max(100).optional(),
  language: z.enum(['ar', 'fr', 'en']).default('ar'),
  theme: z.enum(['light', 'dark', 'mica-light', 'mica-dark']).default('light'),
  accentColor: z.enum(['blue', 'purple', 'emerald', 'orange', 'rose']).default('blue')
});

// Export both full schemas and partial (for updates — all fields optional)
module.exports = {
  ProductSchema,
  ProductUpdateSchema: ProductSchema.partial(),
  ClientSchema,
  ClientUpdateSchema: ClientSchema.partial(),
  InvoiceSchema,
  InvoiceUpdateSchema: InvoiceSchema.partial(),
  SettingsSchema,
  SettingsUpdateSchema: SettingsSchema.partial()
};
