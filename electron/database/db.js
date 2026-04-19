const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

let dbInstance = null;

/**
 * Database Singleton - ensures only one database connection exists
 * Uses better-sqlite3 for synchronous operations
 */
function getDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'fennec_facturation.db');

  dbInstance = new Database(dbPath);

  // Enable WAL mode for better concurrency
  dbInstance.pragma('journal_mode = WAL');

  // Enable foreign keys
  dbInstance.pragma('foreign_keys = ON');

  // Run migrations
  runMigrations(dbInstance);

  return dbInstance;
}

function runMigrations(db) {
  const fs = require('fs');
  
  // Run main schema migration
  const schemaPath = path.join(__dirname, 'migrations', 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    db.exec(schema);
  }

  // Run audit log migration
  const auditPath = path.join(__dirname, 'migrations', '002_audit_log.sql');
  if (fs.existsSync(auditPath)) {
    const auditSchema = fs.readFileSync(auditPath, 'utf-8');
    db.exec(auditSchema);
  }
}

function closeDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

module.exports = {
  getDatabase,
  closeDatabase
};
