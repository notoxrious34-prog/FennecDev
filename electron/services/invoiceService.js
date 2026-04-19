const InvoiceRepository = require('../repositories/invoiceRepository');
const logger = require('../utils/logger');
const { getDatabase } = require('../database/db');
const { validate } = require('../validation/validate');
const { InvoiceSchema, InvoiceUpdateSchema } = require('../validation/schemas');
const { z } = require('zod');
const AuditService = require('./auditService');

/**
 * InvoiceService - Business logic for invoice operations
 * All methods return standardized response envelopes
 */
class InvoiceService {
  constructor(invoiceRepository, auditService) {
    this.invoiceRepository = invoiceRepository;
    this.db = getDatabase();
    this.auditService = auditService || new AuditService(new (require('../repositories/auditRepository'))());
  }

  /**
   * Get all invoices
   */
  async getAllInvoices() {
    try {
      const invoices = this.invoiceRepository.findWithClient();
      return { success: true, data: invoices };
    } catch (error) {
      logger.error('invoiceService.getAllInvoices failed', error);
      return { success: false, error: { code: 'DB_ERROR', message: error.message } };
    }
  }

  /**
   * Get invoice by ID with items
   */
  async getInvoiceById(id) {
    try {
      const invoice = this.invoiceRepository.findByIdWithItems(id);
      if (!invoice) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } };
      }
      return { success: true, data: invoice };
    } catch (error) {
      logger.error('invoiceService.getInvoiceById failed', error);
      return { success: false, error: { code: 'DB_ERROR', message: error.message } };
    }
  }

  /**
   * Create a new invoice with items
   */
  async createInvoice(data) {
    const validation = validate(InvoiceSchema, data);
    if (!validation.success) return validation;

    try {
      const { items, ...invoiceData } = validation.data;
      const invoiceId = invoiceData.id || require('crypto').randomUUID();

      // Use transaction to ensure atomicity
      const result = this.db.transaction(() => {
        // Create invoice
        const invoice = this.invoiceRepository.create({ ...invoiceData, id: invoiceId });

        // Audit log
        this.auditService.logCreate('invoice', invoiceId, invoice);

        // Create invoice items
        const itemStmt = this.db.prepare(`
          INSERT INTO invoice_items (id, invoice_id, product_id, name, quantity, price, total, unit, width, height)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const item of items) {
          const itemId = item.id || require('crypto').randomUUID();
          itemStmt.run(
            itemId,
            invoiceId,
            item.productId || null,
            item.name,
            item.quantity,
            item.price,
            item.total,
            item.unit || null,
            item.width || null,
            item.height || null
          );
        }

        return invoice;
      })();

      return { success: true, data: result };
    } catch (error) {
      logger.error('invoiceService.createInvoice failed', error);
      return { success: false, error: { code: 'DB_ERROR', message: error.message } };
    }
  }

  /**
   * Update an invoice
   */
  async updateInvoice(id, data) {
    const validation = validate(InvoiceUpdateSchema, data);
    if (!validation.success) return validation;

    try {
      const { items, ...invoiceData } = validation.data;

      // Use transaction to ensure atomicity
      const result = this.db.transaction(() => {
        // Get existing for audit
        const existing = this.invoiceRepository.findById(id);

        // Update invoice
        const invoice = this.invoiceRepository.update(id, invoiceData);

        // Audit log
        this.auditService.logUpdate('invoice', id, existing, invoice);

        // If items are provided, replace them
        if (items) {
          // Delete existing items
          this.db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(id);

          // Insert new items
          const itemStmt = this.db.prepare(`
            INSERT INTO invoice_items (id, invoice_id, product_id, name, quantity, price, total, unit, width, height)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          for (const item of items) {
            const itemId = item.id || require('crypto').randomUUID();
            itemStmt.run(
              itemId,
              id,
              item.productId || null,
              item.name,
              item.quantity,
              item.price,
              item.total,
              item.unit || null,
              item.width || null,
              item.height || null
            );
          }
        }

        return invoice;
      })();

      return { success: true, data: result };
    } catch (error) {
      logger.error('invoiceService.updateInvoice failed', error);
      return { success: false, error: { code: 'DB_ERROR', message: error.message } };
    }
  }

  /**
   * Delete an invoice
   */
  async deleteInvoice(id) {
    try {
      const existing = this.invoiceRepository.findById(id);
      if (!existing) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } };
      }
      this.invoiceRepository.delete(id);
      this.auditService.logDelete('invoice', id, existing);
      return { success: true, data: { id } };
    } catch (error) {
      logger.error('invoiceService.deleteInvoice failed', error);
      return { success: false, error: { code: 'DB_ERROR', message: error.message } };
    }
  }

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(id, status) {
    const statusSchema = z.object({ status: z.enum(['paid', 'unpaid', 'partial']) });
    const validation = validate(statusSchema, { status });
    if (!validation.success) return validation;

    try {
      const existing = this.invoiceRepository.findById(id);
      if (!existing) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } };
      }
      const invoice = this.invoiceRepository.update(id, validation.data);
      return { success: true, data: invoice };
    } catch (error) {
      logger.error('invoiceService.updateInvoiceStatus failed', error);
      return { success: false, error: { code: 'DB_ERROR', message: error.message } };
    }
  }

  /**
   * Get unpaid invoices
   */
  async getUnpaidInvoices() {
    try {
      const invoices = this.invoiceRepository.findUnpaid();
      return { success: true, data: invoices };
    } catch (error) {
      logger.error('invoiceService.getUnpaidInvoices failed', error);
      return { success: false, error: { code: 'DB_ERROR', message: error.message } };
    }
  }
}

module.exports = InvoiceService;
