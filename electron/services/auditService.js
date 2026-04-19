const AuditRepository = require('../repositories/auditRepository');
const logger = require('../utils/logger');

/**
 * AuditService - Business logic for audit logging
 * Provides centralized audit logging for all domain services
 */
class AuditService {
  constructor(auditRepository) {
    this.auditRepository = auditRepository;
  }

  /**
   * Log a create action
   */
  logCreate(entity, entityId, data, userId = 'system') {
    try {
      this.auditRepository.log('CREATE', entity, entityId, userId, null, data);
    } catch (error) {
      logger.error('auditService.logCreate failed', error);
    }
  }

  /**
   * Log an update action
   */
  logUpdate(entity, entityId, oldData, newData, userId = 'system') {
    try {
      this.auditRepository.log('UPDATE', entity, entityId, userId, oldData, newData);
    } catch (error) {
      logger.error('auditService.logUpdate failed', error);
    }
  }

  /**
   * Log a delete action
   */
  logDelete(entity, entityId, deletedData, userId = 'system') {
    try {
      this.auditRepository.log('DELETE', entity, entityId, userId, deletedData, null);
    } catch (error) {
      logger.error('auditService.logDelete failed', error);
    }
  }

  /**
   * Get audit logs for an entity
   */
  getEntityHistory(entity, entityId) {
    try {
      const logs = this.auditRepository.findByEntity(entity, entityId);
      return { success: true, data: logs };
    } catch (error) {
      logger.error('auditService.getEntityHistory failed', error);
      return { success: false, error: { code: 'DB_ERROR', message: error.message } };
    }
  }

  /**
   * Get recent audit logs
   */
  getRecentLogs(limit = 100) {
    try {
      const logs = this.auditRepository.getRecent(limit);
      return { success: true, data: logs };
    } catch (error) {
      logger.error('auditService.getRecentLogs failed', error);
      return { success: false, error: { code: 'DB_ERROR', message: error.message } };
    }
  }

  /**
   * Get audit logs by action type
   */
  getLogsByAction(action, limit = 50) {
    try {
      const logs = this.auditRepository.findByAction(action, limit);
      return { success: true, data: logs };
    } catch (error) {
      logger.error('auditService.getLogsByAction failed', error);
      return { success: false, error: { code: 'DB_ERROR', message: error.message } };
    }
  }

  /**
   * Get audit logs by date range
   */
  getLogsByDateRange(startDate, endDate) {
    try {
      const logs = this.auditRepository.findByDateRange(startDate, endDate);
      return { success: true, data: logs };
    } catch (error) {
      logger.error('auditService.getLogsByDateRange failed', error);
      return { success: false, error: { code: 'DB_ERROR', message: error.message } };
    }
  }
}

module.exports = AuditService;
