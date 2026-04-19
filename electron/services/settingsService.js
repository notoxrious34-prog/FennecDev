const SettingsRepository = require('../repositories/settingsRepository');
const logger = require('../utils/logger');
const { validate } = require('../validation/validate');
const { SettingsSchema, SettingsUpdateSchema } = require('../validation/schemas');
const AuditService = require('./auditService');

/**
 * SettingsService - Business logic for settings operations
 * All methods return standardized response envelopes
 */
class SettingsService {
  constructor(settingsRepository, auditService) {
    this.settingsRepository = settingsRepository;
    this.auditService = auditService || new AuditService(new (require('../repositories/auditRepository'))());
  }

  /**
   * Get application settings
   */
  async getSettings() {
    try {
      const settings = this.settingsRepository.getSettings();
      return { success: true, data: settings };
    } catch (error) {
      logger.error('settingsService.getSettings failed', error);
      return { success: false, error: { code: 'DB_ERROR', message: error.message } };
    }
  }

  /**
   * Update application settings
   */
  async updateSettings(data) {
    const validation = validate(SettingsUpdateSchema, data);
    if (!validation.success) return validation;

    try {
      const existing = this.settingsRepository.getSettings();
      const settings = this.settingsRepository.updateSettings(validation.data);
      this.auditService.logUpdate('settings', 1, existing, settings);
      return { success: true, data: settings };
    } catch (error) {
      logger.error('settingsService.updateSettings failed', error);
      return { success: false, error: { code: 'DB_ERROR', message: error.message } };
    }
  }
}

module.exports = SettingsService;
