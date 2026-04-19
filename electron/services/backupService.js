const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const { getDatabase } = require('../database/db');
const logger = require('../utils/logger');

/**
 * BackupService - Automated database backup with pruning
 * Uses better-sqlite3 .backup() API for safe backups
 */
class BackupService {
  constructor() {
    this.db = getDatabase();
    this.backupDir = path.join(app.getPath('userData'), 'backups');
    this.maxBackups = 7; // Keep last 7 days
    this.backupInterval = null;
    
    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Create a backup of the database
   */
  createBackup(filename = null) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = filename || `backup_${timestamp}.db`;
      const backupPath = path.join(this.backupDir, backupName);

      // Use better-sqlite3 backup API
      this.db.backup(backupPath).then(() => {
        logger.info(`Backup created successfully: ${backupName}`);
      }).catch((err) => {
        logger.error('Backup failed', err);
        throw err;
      });

      return { success: true, path: backupPath, filename: backupName };
    } catch (error) {
      logger.error('createBackup failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get list of all backups
   */
  getBackups() {
    try {
      const backups = fs.readdirSync(this.backupDir)
        .filter(file => file.endsWith('.db'))
        .map(file => {
          const filePath = path.join(this.backupDir, file);
          const stats = fs.statSync(filePath);
          return {
            filename: file,
            path: filePath,
            size: stats.size,
            createdAt: stats.birthtime,
            sizeFormatted: this.formatBytes(stats.size)
          };
        })
        .sort((a, b) => b.createdAt - a.createdAt);

      return { success: true, data: backups };
    } catch (error) {
      logger.error('getBackups failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a specific backup
   */
  deleteBackup(filename) {
    try {
      const backupPath = path.join(this.backupDir, filename);
      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath);
        logger.info(`Backup deleted: ${filename}`);
        return { success: true };
      }
      return { success: false, error: 'Backup not found' };
    } catch (error) {
      logger.error('deleteBackup failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Prune old backups, keeping only the most recent N
   */
  pruneBackups() {
    try {
      const backups = fs.readdirSync(this.backupDir)
        .filter(file => file.endsWith('.db'))
        .map(file => ({
          filename: file,
          path: path.join(this.backupDir, file),
          createdAt: fs.statSync(path.join(this.backupDir, file)).birthtime
        }))
        .sort((a, b) => b.createdAt - a.createdAt);

      // Delete backups beyond the max limit
      const toDelete = backups.slice(this.maxBackups);
      for (const backup of toDelete) {
        fs.unlinkSync(backup.path);
        logger.info(`Pruned old backup: ${backup.filename}`);
      }

      return { success: true, deletedCount: toDelete.length };
    } catch (error) {
      logger.error('pruneBackups failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Restore from a backup
   */
  restoreBackup(filename) {
    try {
      const backupPath = path.join(this.backupDir, filename);
      if (!fs.existsSync(backupPath)) {
        return { success: false, error: 'Backup not found' };
      }

      // Close current database connection
      const { closeDatabase } = require('../database/db');
      closeDatabase();

      // Copy backup to main database location
      const dbPath = path.join(app.getPath('userData'), 'fennec_facturation.db');
      fs.copyFileSync(backupPath, dbPath);

      // Reinitialize database
      const { getDatabase: getNewDatabase } = require('../database/db');
      this.db = getNewDatabase();

      logger.info(`Database restored from: ${filename}`);
      return { success: true };
    } catch (error) {
      logger.error('restoreBackup failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start automated daily backups
   */
  startScheduledBackups() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
    }

    // Run backup every 24 hours (86400000 ms)
    this.backupInterval = setInterval(() => {
      this.createBackup();
      this.pruneBackups();
    }, 86400000);

    // Run initial backup
    this.createBackup();
    logger.info('Scheduled backups started (daily)');
  }

  /**
   * Stop automated backups
   */
  stopScheduledBackups() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
      logger.info('Scheduled backups stopped');
    }
  }

  /**
   * Get backup statistics
   */
  getBackupStats() {
    try {
      const backups = this.getBackups();
      if (!backups.success) {
        return backups;
      }

      const totalSize = backups.data.reduce((sum, b) => sum + b.size, 0);
      const oldestBackup = backups.data[backups.data.length - 1];
      const newestBackup = backups.data[0];

      return {
        success: true,
        data: {
          count: backups.data.length,
          totalSize,
          totalSizeFormatted: this.formatBytes(totalSize),
          oldestBackup: oldestBackup?.createdAt || null,
          newestBackup: newestBackup?.createdAt || null,
          maxBackups: this.maxBackups
        }
      };
    } catch (error) {
      logger.error('getBackupStats failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Format bytes to human-readable string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

module.exports = BackupService;
