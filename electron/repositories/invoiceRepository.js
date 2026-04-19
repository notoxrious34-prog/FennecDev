const BaseRepository = require('./baseRepository');

/**
 * InvoiceRepository - Data access layer for invoices
 */
class InvoiceRepository extends BaseRepository {
  constructor() {
    super('invoices');
  }

  /**
   * Find invoices by client ID
   */
  findByClientId(clientId) {
    return this.findWhere({ client_id: clientId });
  }

  /**
   * Find invoices by status
   */
  findByStatus(status) {
    return this.findWhere({ status });
  }

  /**
   * Find invoices by date range
   */
  findByDateRange(startDate, endDate) {
    const stmt = this.db.prepare(`
      SELECT * FROM ${this.tableName}
      WHERE date >= ? AND date <= ?
      ORDER BY date DESC
    `);
    return stmt.all(startDate, endDate);
  }

  /**
   * Find invoice by invoice number
   */
  findByNumber(number) {
    return this.findWhere({ number });
  }

  /**
   * Find unpaid invoices
   */
  findUnpaid() {
    return this.findByStatus('unpaid');
  }

  /**
   * Find invoices with client details
   */
  findWithClient() {
    const stmt = this.db.prepare(`
      SELECT i.*, c.name as client_name, c.phone as client_phone
      FROM ${this.tableName} i
      JOIN clients c ON i.client_id = c.id
      ORDER BY i.date DESC
    `);
    return stmt.all();
  }

  /**
   * Get invoice with items
   */
  findByIdWithItems(id) {
    const invoice = this.findById(id);
    if (!invoice) return null;

    const stmt = this.db.prepare(`
      SELECT * FROM invoice_items
      WHERE invoice_id = ?
      ORDER BY id ASC
    `);
    const items = stmt.all(id);

    return { ...invoice, items };
  }
}

module.exports = InvoiceRepository;
