const { getDatabase } = require('../database/db');

/**
 * BaseRepository - Abstract base class with shared query methods
 * All domain repositories extend this class
 */
class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
    this.db = getDatabase();
  }

  /**
   * Find all rows with optional ordering
   */
  findAll(orderBy = 'id', direction = 'ASC') {
    const stmt = this.db.prepare(`
      SELECT * FROM ${this.tableName}
      ORDER BY ${orderBy} ${direction}
    `);
    return stmt.all();
  }

  /**
   * Find a single row by id
   */
  findById(id) {
    const stmt = this.db.prepare(`
      SELECT * FROM ${this.tableName}
      WHERE id = ?
    `);
    return stmt.get(id);
  }

  /**
   * Find rows matching conditions object
   * Builds safe parameterized WHERE clause
   */
  findWhere(conditions = {}) {
    if (Object.keys(conditions).length === 0) {
      return this.findAll();
    }

    const whereClause = Object.keys(conditions)
      .map(key => `${key} = ?`)
      .join(' AND ');
    const values = Object.values(conditions);

    const stmt = this.db.prepare(`
      SELECT * FROM ${this.tableName}
      WHERE ${whereClause}
    `);
    return stmt.all(...values);
  }

  /**
   * Create a new record from data object
   */
  create(data = {}) {
    const keys = Object.keys(data);
    const placeholders = keys.map(() => '?').join(', ');
    const values = Object.values(data);

    const stmt = this.db.prepare(`
      INSERT INTO ${this.tableName} (${keys.join(', ')})
      VALUES (${placeholders})
    `);

    const info = stmt.run(...values);
    return this.findById(info.lastInsertRowid);
  }

  /**
   * Update a record by id
   */
  update(id, data = {}) {
    const keys = Object.keys(data);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), id];

    // Add updated_at timestamp if the column exists
    if (!keys.includes('updated_at')) {
      const setWithTimestamp = `${setClause}, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`;
      const stmt = this.db.prepare(`
        UPDATE ${this.tableName}
        SET ${setWithTimestamp}
        WHERE id = ?
      `);
      stmt.run(...values);
    } else {
      const stmt = this.db.prepare(`
        UPDATE ${this.tableName}
        SET ${setClause}
        WHERE id = ?
      `);
      stmt.run(...values);
    }

    return this.findById(id);
  }

  /**
   * Delete a record by id
   * Soft delete if deleted_at column exists, hard delete otherwise
   */
  delete(id) {
    // Check if deleted_at column exists
    const tableInfo = this.db.pragma(`table_info(${this.tableName})`);
    const hasDeletedAt = tableInfo.some(col => col.name === 'deleted_at');

    if (hasDeletedAt) {
      const stmt = this.db.prepare(`
        UPDATE ${this.tableName}
        SET deleted_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = ?
      `);
      return stmt.run(id);
    } else {
      const stmt = this.db.prepare(`
        DELETE FROM ${this.tableName}
        WHERE id = ?
      `);
      return stmt.run(id);
    }
  }

  /**
   * Count records matching conditions
   */
  count(conditions = {}) {
    if (Object.keys(conditions).length === 0) {
      const stmt = this.db.prepare(`
        SELECT COUNT(*) as count FROM ${this.tableName}
      `);
      const result = stmt.get();
      return result.count;
    }

    const whereClause = Object.keys(conditions)
      .map(key => `${key} = ?`)
      .join(' AND ');
    const values = Object.values(conditions);

    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM ${this.tableName}
      WHERE ${whereClause}
    `);
    const result = stmt.get(...values);
    return result.count;
  }

  /**
   * Execute a transaction with multiple operations
   */
  transaction(fn) {
    const transaction = this.db.transaction(fn);
    return transaction();
  }
}

module.exports = BaseRepository;
