const BaseRepository = require('./baseRepository');

/**
 * SettingsRepository - Data access layer for application settings
 */
class SettingsRepository extends BaseRepository {
  constructor() {
    super('settings');
  }

  /**
   * Get settings (always returns the single row with id=1)
   */
  getSettings() {
    return this.findById(1);
  }

  /**
   * Update settings (always updates the row with id=1)
   */
  updateSettings(data) {
    return this.update(1, data);
  }
}

module.exports = SettingsRepository;
