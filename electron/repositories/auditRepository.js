const BaseRepository = require('./baseRepository');

/**
 * AuditRepository - Data access layer for audit logs
 * Immutable trail - no delete/update operations
 */
class AuditRepository extends BaseRepository {
  constructor() {
    super('audit_log');
  }

  /**
   * Log an audit entry
   */
  log(action, entity, entityId, userId, payload, newPayload, metadata = {}) {
    const stmt = this.db.prepare(`
      INSERT INTO audit_log (action, entity, entityId, userId, payload, newPayload, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      action,
      entity,
      entityId,
      userId,
      payload ? JSON.stringify(payload) : null,
      newPayload ? JSON.stringify(newPayload) : null,
      metadata ? JSON.stringify(metadata) : null
    );
    
    return this.findById(result.lastInsertRowid);
  }

  /**
   * Get audit logs by entity
   */
  findByEntity(entity, entityId) {
    const stmt = this.db.prepare(`
      SELECT * FROM audit_log
      WHERE entity = ? AND entityId = ?
      ORDER BY timestamp DESC
      LIMIT 100
    `);
    return stmt.all(entity, entityId);
  }

  /**
   * Get audit logs by action type
   */
  findByAction(action, limit = 50) {
    const stmt = this.db.prepare(`
      SELECT * FROM audit_log
      WHERE action = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);
    return stmt.all(action, limit);
  }

  /**
   * Get recent audit logs
   */
  getRecent(limit = 100) {
    const stmt = this.db.prepare(`
      SELECT * FROM audit_log
      ORDER BY timestamp DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  }

  /**
   * Get audit logs by date range
   */
  findByDateRange(startDate, endDate) {
    const stmt = this.db.prepare(`
      SELECT * FROM audit_log
      WHERE timestamp >= ? AND timestamp <= ?
      ORDER BY timestamp DESC
    `);
    return stmt.all(startDate, endDate);
  }

  /**
   * Override delete to prevent deletion of audit records
   */
  delete(id) {
    throw new Error('Audit log records cannot be deleted');
  }

  /**
   * Override update to prevent modification of audit records
   */
  update(id, data) {
    throw new Error('Audit log records cannot be modified');
  }
}

module.exports = AuditRepository;
