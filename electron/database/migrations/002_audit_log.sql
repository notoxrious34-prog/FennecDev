-- Audit Log Migration
-- Creates immutable trail of all critical business actions

CREATE TABLE IF NOT EXISTS audit_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  action     TEXT    NOT NULL,
  entity     TEXT    NOT NULL,
  entityId   INTEGER,
  userId     TEXT    NOT NULL DEFAULT 'system',
  payload    TEXT,
  newPayload TEXT,
  ipAddress  TEXT,
  metadata   TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity, entityId);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
