const BackupService = require('../services/backupService');

/**
 * BackupController - IPC handlers for backup operations
 * Thin orchestrator layer - no business logic
 */
class BackupController {
  constructor(backupService) {
    this.backupService = backupService;
  }

  async create(event) {
    return await this.backupService.createBackup();
  }

  async getAll(event) {
    return await this.backupService.getBackups();
  }

  async delete(event, filename) {
    if (!filename || typeof filename !== 'string') {
      return { success: false, error: { code: 'INVALID_INPUT', message: 'Filename is required' } };
    }
    return await this.backupService.deleteBackup(filename);
  }

  async restore(event, filename) {
    if (!filename || typeof filename !== 'string') {
      return { success: false, error: { code: 'INVALID_INPUT', message: 'Filename is required' } };
    }
    return await this.backupService.restoreBackup(filename);
  }

  async getStats(event) {
    return await this.backupService.getBackupStats();
  }

  async prune(event) {
    return await this.backupService.pruneBackups();
  }
}

module.exports = BackupController;
