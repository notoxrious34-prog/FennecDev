// electron/utils/logger.js
const fs   = require('fs');
const path = require('path');
const { app } = require('electron');

class Logger {
  constructor() {
    this._logDir  = null;
    this._logFile = null;
    this._stream  = null;
  }

  // Call this AFTER app.whenReady() — before that, app.getPath() fails
  init() {
    this._logDir  = path.join(app.getPath('userData'), 'logs');
    fs.mkdirSync(this._logDir, { recursive: true });

    const today   = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    this._logFile = path.join(this._logDir, `app-${today}.log`);
    this._stream  = fs.createWriteStream(this._logFile, { flags: 'a', encoding: 'utf8' });

    this._pruneOldLogs(); // Keep only 14 days of logs
    this.info('Logger initialized', { logFile: this._logFile });
  }

  _write(level, message, meta = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(Object.keys(meta).length > 0 ? { meta } : {}),
    };
    const line = JSON.stringify(entry) + '\n';

    // Always write to console in development
    if (!app.isPackaged) {
      const color = { INFO: '\x1b[36m', WARN: '\x1b[33m', ERROR: '\x1b[31m', DEBUG: '\x1b[90m' };
      process.stdout.write(`${color[level] || ''}[${level}] ${message}\x1b[0m\n`);
    }

    // Always write to file (in both dev and production)
    if (this._stream) {
      this._stream.write(line);
    }
  }

  _pruneOldLogs() {
    try {
      const MAX_LOG_DAYS = 14;
      const cutoff = Date.now() - (MAX_LOG_DAYS * 24 * 60 * 60 * 1000);
      fs.readdirSync(this._logDir)
        .filter(f => f.startsWith('app-') && f.endsWith('.log'))
        .map(f => ({ file: f, mtime: fs.statSync(path.join(this._logDir, f)).mtimeMs }))
        .filter(({ mtime }) => mtime < cutoff)
        .forEach(({ file }) => {
          fs.unlinkSync(path.join(this._logDir, file));
          this._write('INFO', `Pruned old log file: ${file}`);
        });
    } catch (err) {
      this._write('WARN', 'Failed to prune old logs', { error: err.message });
    }
  }

  close() {
    if (this._stream) {
      this._stream.end();
      this._stream = null;
    }
  }

  info  (message, meta) { this._write('INFO',  message, meta); }
  warn  (message, meta) { this._write('WARN',  message, meta); }
  error (message, meta) { this._write('ERROR', message, meta); }
  debug (message, meta) { this._write('DEBUG', message, meta); }
}

// Singleton
const logger = new Logger();
module.exports = logger;
