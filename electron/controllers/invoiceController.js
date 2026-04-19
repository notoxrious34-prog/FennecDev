const InvoiceService = require('../services/invoiceService');

/**
 * InvoiceController - IPC handlers for invoice operations
 * Thin orchestrator layer - no business logic
 */
class InvoiceController {
  constructor(invoiceService) {
    this.invoiceService = invoiceService;
  }

  async getAll(event) {
    return await this.invoiceService.getAllInvoices();
  }

  async getById(event, id) {
    if (!id || typeof id !== 'string') {
      return { success: false, error: { code: 'INVALID_INPUT', message: 'Valid invoice ID required' } };
    }
    return await this.invoiceService.getInvoiceById(id);
  }

  async create(event, data) {
    if (!data || !data.clientId || !data.number || !data.date || !data.items || !Array.isArray(data.items)) {
      return { success: false, error: { code: 'INVALID_INPUT', message: 'Client ID, number, date, and items array are required' } };
    }
    if (data.items.length === 0) {
      return { success: false, error: { code: 'INVALID_INPUT', message: 'At least one item is required' } };
    }
    return await this.invoiceService.createInvoice(data);
  }

  async update(event, id, data) {
    if (!id || typeof id !== 'string') {
      return { success: false, error: { code: 'INVALID_INPUT', message: 'Valid invoice ID required' } };
    }
    if (!data) {
      return { success: false, error: { code: 'INVALID_INPUT', message: 'Data is required' } };
    }
    return await this.invoiceService.updateInvoice(id, data);
  }

  async delete(event, id) {
    if (!id || typeof id !== 'string') {
      return { success: false, error: { code: 'INVALID_INPUT', message: 'Valid invoice ID required' } };
    }
    return await this.invoiceService.deleteInvoice(id);
  }

  async updateStatus(event, id, status) {
    if (!id || typeof id !== 'string') {
      return { success: false, error: { code: 'INVALID_INPUT', message: 'Valid invoice ID required' } };
    }
    if (!status || !['paid', 'unpaid', 'partial'].includes(status)) {
      return { success: false, error: { code: 'INVALID_INPUT', message: 'Valid status required (paid, unpaid, partial)' } };
    }
    return await this.invoiceService.updateInvoiceStatus(id, status);
  }

  async getUnpaid(event) {
    return await this.invoiceService.getUnpaidInvoices();
  }
}

module.exports = InvoiceController;
