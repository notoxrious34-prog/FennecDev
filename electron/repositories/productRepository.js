const BaseRepository = require('./baseRepository');

/**
 * ProductRepository - Data access layer for products
 */
class ProductRepository extends BaseRepository {
  constructor() {
    super('products');
  }

  /**
   * Find products by category
   */
  findByCategory(category) {
    return this.findWhere({ category });
  }

  /**
   * Find products with low stock
   */
  findLowStock(threshold = 5) {
    const stmt = this.db.prepare(`
      SELECT * FROM ${this.tableName}
      WHERE stock_quantity <= ?
      AND is_active = 1
      ORDER BY stock_quantity ASC
    `);
    return stmt.all(threshold);
  }

  /**
   * Find active products only
   */
  findActive() {
    return this.findWhere({ is_active: 1 });
  }

  /**
   * Search products by name
   */
  search(query) {
    const stmt = this.db.prepare(`
      SELECT * FROM ${this.tableName}
      WHERE name LIKE ?
      AND is_active = 1
      ORDER BY name ASC
    `);
    return stmt.all(`%${query}%`);
  }

  /**
   * Update stock quantity
   */
  updateStock(id, quantity) {
    const stmt = this.db.prepare(`
      UPDATE ${this.tableName}
      SET stock_quantity = ?,
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id = ?
    `);
    return stmt.run(quantity, id);
  }
}

module.exports = ProductRepository;
