const SettingsService = require('../services/settingsService');

/**
 * SettingsController - IPC handlers for settings operations
 * Thin orchestrator layer - no business logic
 */
class SettingsController {
  constructor(settingsService) {
    this.settingsService = settingsService;
  }

  async get(event) {
    return await this.settingsService.getSettings();
  }

  async update(event, data) {
    if (!data || typeof data !== 'object') {
      return { success: false, error: { code: 'INVALID_INPUT', message: 'Settings data is required' } };
    }
    return await this.settingsService.updateSettings(data);
  }
}

module.exports = SettingsController;
