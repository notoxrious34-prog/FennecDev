const BaseRepository = require('./baseRepository');

/**
 * ClientRepository - Data access layer for clients
 */
class ClientRepository extends BaseRepository {
  constructor() {
    super('clients');
  }

  /**
   * Find clients by type (individual or company)
   */
  findByType(type) {
    return this.findWhere({ type });
  }

  /**
   * Search clients by name or phone
   */
  search(query) {
    const stmt = this.db.prepare(`
      SELECT * FROM ${this.tableName}
      WHERE name LIKE ? OR phone LIKE ?
      ORDER BY name ASC
    `);
    const searchPattern = `%${query}%`;
    return stmt.all(searchPattern, searchPattern);
  }

  /**
   * Find clients with invoices count
   */
  findWithInvoiceCount() {
    const stmt = this.db.prepare(`
      SELECT c.*, COUNT(i.id) as invoice_count
      FROM ${this.tableName} c
      LEFT JOIN invoices i ON c.id = i.client_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `);
    return stmt.all();
  }
}

module.exports = ClientRepository;
