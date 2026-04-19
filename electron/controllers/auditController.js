const AuditService = require('../services/auditService');

/**
 * AuditController - IPC handlers for audit operations
 * Thin orchestrator layer - no business logic
 */
class AuditController {
  constructor(auditService) {
    this.auditService = auditService;
  }

  async getRecent(event, limit = 100) {
    return await this.auditService.getRecentLogs(limit);
  }

  async getByEntity(event, entity, entityId) {
    if (!entity || !entityId) {
      return { success: false, error: { code: 'INVALID_INPUT', message: 'Entity and entityId are required' } };
    }
    return await this.auditService.getEntityHistory(entity, entityId);
  }

  async getByDateRange(event, startDate, endDate) {
    if (!startDate || !endDate) {
      return { success: false, error: { code: 'INVALID_INPUT', message: 'Start and end dates are required' } };
    }
    return await this.auditService.getLogsByDateRange(startDate, endDate);
  }
}

module.exports = AuditController;
