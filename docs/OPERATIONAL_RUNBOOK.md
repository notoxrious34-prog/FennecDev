# Operational Runbook — Fennec Facturation
## Version 3.0.1 | Confidential — Internal Use Only

---

## 1. System Overview

**Application:** Fennec Facturation
**Type:** Desktop ERP — Electron application (offline, single-user)
**Stack:** Electron + React + Vite + SQLite (better-sqlite3)
**Languages:** Arabic (RTL), French (LTR — default), English (LTR)
**License:** Machine-bound RSA-SHA256 asymmetric cryptography
**Platform:** Windows 10/11 x64 (primary), macOS (secondary)

### Architecture in One Paragraph
The application runs entirely locally with no network dependency for core operations.
The Electron main process hosts the Node.js backend: a layered architecture of
Controllers → Services → Repositories communicating with a single SQLite database.
The React frontend communicates with the backend exclusively via Electron's IPC bridge
(contextBridge), with contextIsolation enforced. All user input is validated by Zod
schemas in the service layer before any database write. Every create, update, and delete
operation is recorded in an immutable audit_log table. The SQLite database is
automatically backed up daily using better-sqlite3's native hot-backup API.

---

## 2. Critical File Locations

### Application Files (Development Machine)
```
[Project Root]/
├── electron/
│   ├── main.js                        ← Electron lifecycle (< 120 lines)
│   ├── preload.js                     ← window.api surface (contextBridge)
│   ├── ipc/ipcRouter.js               ← ALL ipcMain.handle registrations
│   ├── controllers/                   ← Parameter extraction only
│   ├── services/                      ← Business logic + Zod validation
│   ├── repositories/                  ← SQL queries (better-sqlite3)
│   ├── database/db.js                 ← SQLite singleton (WAL, FK enforcement)
│   ├── security/publicKey.js          ← RSA public key (safe to commit)
│   └── utils/logger.js                ← File + console logging
├── src/                               ← React frontend
│   ├── contexts/                      ← Split contexts (Data, Actions, Settings, i18n)
│   ├── components/ui/                 ← Design system primitives
│   ├── locales/                       ← ar.json, fr.json, en.json
│   └── styles/design-system.css      ← CSS token system
├── tools/
│   ├── issueLicense.js                ← CLI: generate customer license tokens
│   ├── verifyLicense.js               ← CLI: verify a token's signature
│   ├── signLicense.js                 ← CLI: sign a license payload
│   └── generateKeyPair.js             ← CLI: generate RSA key pairs
└── scripts/
    ├── i18nAudit.js                   ← Verify translation completeness
    ├── preDistCheck.js                ← 44-check pre-release gate
    └── bumpVersion.js                 ← Version increment tool
```

### Customer Machine (Production)
```
C:\Users\<username>\AppData\Roaming\fennec-facturation\
├── database.sqlite                    ← ALL business data (protect this file)
├── database.sqlite-shm                ← SQLite WAL shared memory (auto-managed)
├── database.sqlite-wal                ← SQLite WAL log (auto-managed)
├── .license                           ← Activated license token (JSON base64)
├── window-state.json                  ← Window position/size preferences
├── last_backup.txt                    ← ISO timestamp of last successful backup
├── backups/
│   ├── backup_YYYY-MM-DD_HH-MM-SS.sqlite  ← Daily backups (7 retained)
│   └── ...
└── logs/
    ├── app-YYYY-MM-DD.log             ← Daily log file (JSON lines format)
    └── ...  (14 days retained)
```

### Private Key (Operator — Secure Storage ONLY)
```
NOT in the repository. NOT on the development machine's main drive.
Location: [Encrypted USB] + [Password Manager secure note] + [Company encrypted storage]
Filename: fennec_license_private_encrypted.pem  (AES-256 encrypted with passphrase)
Passphrase: Stored in company password manager under "Fennec Facturation License Key"
```

---

## 3. License System Operations

### 3.1 — Issuing a License (New Customer)

**Prerequisites:**
- The encrypted private key (`fennec_license_private_encrypted.pem`)
- OpenSSL available in the terminal
- The customer's Machine ID (they provide this from the activation screen)

**Command:**
```bash
node tools/issueLicense.js <machine-id> --type full --days 365 --output <customer-name>.license
```

**Example:**
```bash
node tools/issueLicense.js cd9f101a2e1d325ecaf423f039e401c236670e3c41b1cfdc3b9550e4d5c46b85 --type full --days 365 --output acme-corp.license
```

**Output:** A license file printed to stdout. Send this to the customer.

### 3.2 — Verifying a License Token (Support/Debugging)

```bash
# Using the verification tool (requires inline execution due to module loading):
node -e "const crypto=require('crypto');const fs=require('fs');const publicKeyModule=require('./electron/security/publicKey');const publicKey=publicKeyModule.PUBLIC_KEY;const tokenString=fs.readFileSync('<license-file>','utf8');const token=JSON.parse(tokenString);const payload=token.payload;const signature=token.signature;const payloadString=JSON.stringify(payload);const verify=crypto.createVerify('SHA256');verify.update(payloadString);verify.end();const isValid=verify.verify(publicKey,signature,'base64');if(!isValid){console.error('❌ License signature is INVALID');process.exit(1);}const now=Date.now();const expiresAt=payload.expiresAt;if(now>expiresAt){console.error('❌ License has expired');process.exit(1);}const currentMachineId=require('node-machine-id').machineIdSync();if(payload.machineId!==currentMachineId){console.error('❌ License machine ID mismatch');process.exit(1);}console.log('✅ License is valid');console.log('   Machine ID:',payload.machineId);console.log('   License Type:',payload.licenseType);console.log('   Issued:',new Date(payload.issuedAt).toISOString());console.log('   Expires:',new Date(expiresAt).toISOString());console.log('   Time remaining:',Math.floor((expiresAt-now)/(1000*60*60*24)),'days');"
```

Output shows: signature validity, machine ID, expiry date, days remaining.

### 3.3 — Re-issuing a License (Machine Change / Hardware Upgrade)

Customer's hardware changed → their Machine ID changed → old license fails with MACHINE_MISMATCH.

1. Customer sends you their NEW Machine ID (from the activation screen).
2. Run `issueLicense.js` with the new Machine ID and the same license type.
3. Set `--days` to match the remaining time on the original license (no extension for hardware change).
4. Send the new token. Customer pastes it into the activation screen.

### 3.4 — Renewing an Expired License

Same as re-issuing, but set a new `--days` value (typically 365 for annual renewal).
The Machine ID stays the same (customer's machine hasn't changed).

### 3.5 — License Validation Logic (for debugging activation failures)

When a customer activates, the app runs these checks in order:
```
1. Decode base64 token → extract { payload, signature }
2. Verify RSA-SHA256 signature (payload + publicKey) → INVALID_SIGNATURE if fails
3. Check payload.expiresAt < today → LICENSE_EXPIRED if true
4. Get machineIdSync() → compare with payload.machineId → MACHINE_MISMATCH if different
5. All pass → store token in userData/.license → return success
```

---

## 4. Database Operations

### 4.1 — Schema Location
All schema migrations are in `electron/database/migrations/`.
They are applied automatically in `electron/database/db.js` on startup.
All migrations use `IF NOT EXISTS` — they are idempotent and safe to re-run.

### 4.2 — Direct Database Access (Support)
```bash
# Open the customer's database for inspection (read-only):
sqlite3 "C:\Users\<username>\AppData\Roaming\fennec-facturation\database.sqlite"

# Useful queries:
.tables                                          -- List all tables
SELECT COUNT(*) FROM invoices;                   -- Count invoices
SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 20;  -- Recent changes
SELECT * FROM products WHERE stockQuantity <= lowStockThreshold;  -- Low stock
PRAGMA integrity_check;                          -- Verify database integrity
```

### 4.3 — Manual Backup Restore
```
SCENARIO: Customer reports data loss or corruption after a crash.

1. Close the application on the customer machine.
2. Navigate to: C:\Users\<user>\AppData\Roaming\fennec-facturation\
3. Rename database.sqlite to database.sqlite.corrupted
   (Preserve it — do not delete, may be needed for forensics)
4. Identify the last good backup in backups/:
   - Sort by filename descending (filenames include timestamps)
   - Choose the most recent backup that predates the reported issue
5. Copy the chosen backup file to the userData directory.
6. Rename it to database.sqlite
7. Launch the application.
8. Verify data integrity: check that recent invoices/clients/products are visible.
9. If incorrect backup chosen: repeat from step 3 with a different backup file.
```

### 4.4 — WAL Mode Explanation (for support staff)
The database runs in WAL (Write-Ahead Logging) mode. This creates two companion files:
- `database.sqlite-shm` — shared memory index
- `database.sqlite-wal` — write-ahead log

These files are NORMAL and expected. They are NOT separate databases.
When backing up manually, copy all three files together.
The automated backup system uses `better-sqlite3`'s `.backup()` API which handles
WAL correctly — manual file copies are safe ONLY when the application is closed.

---

## 5. Build & Release Process

### 5.1 — Standard Release Checklist

```bash
# Step 1: Make and commit all code changes
git add -A && git commit -m "feat: description of changes"

# Step 2: Run the full audit suite
node scripts/i18nAudit.js                 # Must exit 0
node scripts/preDistCheck.js              # Must show 44 passed, 0 failed

# Step 3: Bump version
npm run version:patch    # Bug fixes (3.0.1 → 3.0.2)
npm run version:minor    # New features (3.0.1 → 3.1.0)
npm run version:major    # Breaking changes (3.0.1 → 4.0.0)
# Then: fill in CHANGELOG.md [new version] section

# Step 4: Build
npm run build && npm run dist

# Step 5: Smoke test the installer
# (Install, verify DevTools blocked, verify license, verify Arabic RTL)

# Step 6: Tag and archive
git tag -a vX.Y.Z -m "Fennec Facturation vX.Y.Z — [description]"
# Archive installer + SHA256 checksum

# Step 7: Update CHANGELOG.md with actual release date
```

### 5.2 — preDistCheck.js Check Groups
The script runs 44 checks across 8 groups:
1. **Security** — No private key, no keygen refs, public key is real, no hardcoded secrets
2. **Electron Security Config** — contextIsolation, nodeIntegration, webSecurity, DevTools, navigation lock, single instance
3. **Architecture Integrity** — Required files exist, no SQL outside repos, no ipcMain outside ipcRouter
4. **Build Output** — dist/ exists, relative paths in index.html, no source maps, no Zod in frontend
5. **Packaging Configuration** — electron-builder.yml valid, asar:true, native modules unpacked
6. **Package Metadata** — productName, semver version, author, private:true, correct main entry
7. **Internationalization** — i18nAudit passes, all three locale files exist, copyright year current
8. **Documentation** — README, CHANGELOG, KEYGEN_INSTRUCTIONS, KNOWN_ISSUES exist

### 5.3 — Emergency Hotfix Process
For a critical bug discovered in production:
```bash
# Create a hotfix branch from the release tag
git checkout -b hotfix/3.0.2 v3.0.1

# Fix the bug
# ... make changes ...

# Follow the standard release checklist from Step 2
npm run version:patch  # 3.0.1 → 3.0.2
# ... build, test, tag ...

# Merge back to main
git checkout main
git merge hotfix/3.0.2
git branch -d hotfix/3.0.2
```

---

## 6. Logging & Diagnostics

### 6.1 — Log File Location
```
Customer machine: C:\Users\<user>\AppData\Roaming\fennec-facturation\logs\
Format: JSON Lines (one JSON object per line)
Retention: 14 days (older files auto-deleted on app startup)
```

### 6.2 — Reading Log Files
```bash
# View the most recent log file (PowerShell):
$logDir = "$env:APPDATA\fennec-facturation\logs"
$latestLog = Get-ChildItem $logDir | Sort-Object Name -Descending | Select-Object -First 1
Get-Content $latestLog.FullName | ForEach-Object { $_ | ConvertFrom-Json }

# Filter for errors only:
Get-Content $latestLog.FullName | ForEach-Object {
  $entry = $_ | ConvertFrom-Json
  if ($entry.level -eq 'ERROR') { $entry }
}

# Or use Node.js to parse:
node -e "
const fs = require('fs');
const logs = fs.readFileSync('path/to/app-YYYY-MM-DD.log', 'utf8')
  .split('\n').filter(Boolean)
  .map(JSON.parse)
  .filter(e => e.level === 'ERROR');
console.table(logs);
"
```

### 6.3 — Common Log Messages and Their Meaning
```
INFO  "Application starting"              → Normal startup
INFO  "Logger initialized"                → Log file opened successfully
INFO  "Database connection closed cleanly" → Normal shutdown
INFO  "Backup completed"                  → Automated backup succeeded
WARN  "Blocked navigation attempt to: X" → Something tried to open an external URL
                                            inside the app (not necessarily malicious)
WARN  "Failed to prune old logs"          → Log directory may have permission issues
ERROR "productService.createProduct failed" → DB write failed (check full error message)
ERROR "Backup failed"                     → Check disk space in userData drive
```

### 6.4 — Accessing Logs from the Application UI
Settings → General tab → "View Application Logs" button opens the logs directory
in Windows Explorer. Available since v3.0.0.

---

## 7. IPC API Surface Reference

Complete reference of all `window.api` methods available in the React frontend.
Each method returns `Promise<{ success: boolean, data?: T, error?: { code, message, details? } }>`.

### Products
```typescript
window.api.product.getAll()                    // All active products
window.api.product.getById(id: number)
window.api.product.create(data: ProductInput)  // Zod-validated
window.api.product.update(id, data)            // Zod-validated (partial)
window.api.product.delete(id: number)
window.api.product.findLowStock(threshold?)
window.api.product.findByCategory(category)
```

### Clients
```typescript
window.api.client.getAll()
window.api.client.getById(id: number)
window.api.client.create(data: ClientInput)
window.api.client.update(id, data)
window.api.client.delete(id: number)
```

### Invoices
```typescript
window.api.invoice.getAll()
window.api.invoice.getById(id: number)
window.api.invoice.create(data: InvoiceInput)  // Includes line items
window.api.invoice.update(id, data)
window.api.invoice.delete(id: number)
window.api.invoice.getByClientId(clientId)
window.api.invoice.getByDateRange(start, end)
window.api.invoice.updateStatus(id, status)
```

### Reports / Dashboard
```typescript
window.api.report.getDashboardStats()
// Returns: { totalRevenue, invoiceCount, activeClients,
//            lowStockProducts, pendingInvoices,
//            monthlyRevenue, lastMonthRevenue }
```

### Backup
```typescript
window.api.backup.triggerManual()
// Returns: { backupPath, sizeBytes, timestamp }

window.api.backup.getLastBackupInfo()
// Returns: { lastBackupAt, totalBackups, backupFiles: string[] }
```

### Audit Log
```typescript
window.api.audit.getRecent(limit?: number)        // Default: 100
window.api.audit.getByEntity(entity, entityId?)
window.api.audit.getByDateRange(start, end)
```

### License
```typescript
window.api.license.activate({ licenseToken })
window.api.license.checkStatus()
// Returns: { valid: boolean, reason?: string }

window.api.license.getDetails()
// Returns the decoded license payload or null

window.api.license.getMachineId()
// Returns the current machine's ID string
```

### Application Utilities
```typescript
window.api.app.getLogPath()
// Returns: { logPath: string }

window.api.app.openInExplorer(path)
// Opens a directory in Windows Explorer

window.api.app.openExternal(url)
// Opens URL in system browser (whitelisted domains only)
```

---

## 8. Adding a New Feature — Developer Reference

### The Complete IPC Feature Pattern (5 files, always in this order)

**1. Repository** (`electron/repositories/entityRepository.js`)
```javascript
// Add a method — SQL only, no business logic
findByCustomCriteria(criteria) {
  return this.db.prepare(
    'SELECT * FROM entity WHERE column = ? ORDER BY name ASC'
  ).all(criteria);
}
```

**2. Service** (`electron/services/entityService.js`)
```javascript
// Validate → Execute → Audit → Return envelope
async customFeature(rawInput) {
  const validation = validate(EntitySchema, rawInput);
  if (!validation.success) return validation;

  try {
    const result = this.entityRepository.findByCustomCriteria(validation.data.criteria);
    return { success: true, data: result };
  } catch (error) {
    logger.error('entityService.customFeature', { error: error.message });
    return { success: false, error: { code: 'DB_ERROR', message: error.message } };
  }
}
```

**3. Controller** (`electron/controllers/entityController.js`)
```javascript
// Extract → Call service → Return (nothing else)
async customFeature(event, args) {
  const { criteria } = args || {};
  if (!criteria) return {
    success: false,
    error: { code: 'MISSING_ARGS', message: 'criteria is required' }
  };
  return this.entityService.customFeature({ criteria });
}
```

**4. IPC Router** (`electron/ipc/ipcRouter.js`)
```javascript
ipcMain.handle('entity:customFeature', (event, args) =>
  entityController.customFeature(event, args)
);
```

**5. Preload** (`electron/preload.js`)
```javascript
entity: {
  // ... existing methods
  customFeature: (args) => ipcRenderer.invoke('entity:customFeature', args),
}
```

**6. Translation keys** — add to en.json, fr.json, ar.json, run `node scripts/i18nAudit.js` 

**7. React component** — consume via `window.api.entity.customFeature(args)` 

### Validation Schema Pattern
All schemas are in `electron/validation/schemas.js`.
For new entities, add:
```javascript
const NewEntitySchema = z.object({
  name:  z.string().min(1).max(255),
  value: z.number().positive(),
  // ... fields
});
const NewEntityUpdateSchema = NewEntitySchema.partial();
module.exports = { ..., NewEntitySchema, NewEntityUpdateSchema };
```

---

## 9. Known Issues & Workarounds

See `KNOWN_ISSUES.md` for the complete, up-to-date list.

**Active issues as of v3.0.1:**
- `[ISSUE-001]` Large tables (500+ rows) — no virtualization yet (v3.1.0 planned)
- `[ISSUE-002]` Windows print dialog renders LTR regardless of app language (OS limitation)
- `[ISSUE-003]` Tajawal font requires internet on first Arabic use (CDN dependency)
- `[ISSUE-004]` Window position may be off-screen after monitor disconnection
- `[SEC-001]`   Code signing not implemented — SmartScreen warning on install
- `[SEC-002]`   Google Fonts in CSP (resolve with [ISSUE-003] fix in v3.1.0)

**Resolved issues:**
- `[ISSUE-005]` i18nAudit regex bug — ✅ Resolved in v3.0.1
- `[ISSUE-ENV-001]` lightningcss EPERM on Windows — ✅ Resolved (AV exclusion + npm config)

---

## 10. Security Reference

### What Is Protected and How

| Asset | Protection Method | Location |
|-------|------------------|----------|
| RSA Private Key | AES-256 encrypted PEM + passphrase | Offline, never in repo |
| RSA Public Key | Embedded in ASAR bundle | `electron/security/publicKey.js` |
| License Token | Machine-bound RSA-SHA256 signed JWT-like structure | `userData/.license` |
| Customer Data | SQLite with WAL, foreign keys, daily encrypted backups | `userData/database.sqlite` |
| Source Code | ASAR packaging (obfuscation, not encryption) | Inside installer |
| IPC Bridge | contextIsolation:true, nodeIntegration:false, contextBridge only | `preload.js` |
| DevTools | Blocked in production via `app.isPackaged` + input event interception | `main.js` |
| Navigation | will-navigate handler rejects non-app URLs | `main.js` |
| External Links | domain whitelist via `app:openExternal` IPC channel | `ipcRouter.js` |
| User Input | Zod schema validation before any DB write | `services/*.js` |

### What Is NOT Protected (Accepted Risks)

| Risk | Justification | Mitigation |
|------|--------------|------------|
| ASAR is not encrypted | Electron limitation; source code can be extracted by skilled attacker | Acceptable for a local desktop app — not a web-facing server |
| SQLite not encrypted | SQLite Encryption Extension (SEE) requires commercial license | Daily backups reduce data loss risk; physical machine security is the primary control |
| No code signing (v3.0.1) | Certificate costs and process overhead deferred | Documented in KNOWN_ISSUES.md; planned for v3.1.0 |
| Google Fonts CDN | Minor: makes an outbound HTTPS request on first Arabic use | Planned fix: bundle fonts locally in v3.1.0 |

---

## 11. Contacts & Escalation

| Role | Responsibility | Contact |
|------|---------------|---------|
| Primary Developer | Code changes, bug fixes, new releases | [developer@company.com] |
| License Authority | Issuing and revoking license tokens | [operator@company.com] |
| Customer Support | First-line support, log collection | [support@company.com] |
| Database Recovery | Manual backup restore procedures | Primary Developer |

### Private Key Custodian
The encrypted private key passphrase is stored in the company password manager.
Access requires: [role/permission level].
In case of key custodian unavailability: [backup custodian name/contact].

---

## 12. Glossary

| Term | Definition |
|------|-----------|
| ASAR | Atom Shell Archive — Electron's packaging format that bundles source files into a single archive |
| contextBridge | Electron API that safely exposes main process functionality to the renderer (window.api) |
| contextIsolation | Electron security setting that isolates the preload script's context from the webpage |
| IPC | Inter-Process Communication — the message-passing system between Electron's main process and renderer |
| Machine ID | A hardware-derived identifier used to bind licenses to specific machines |
| RSA-SHA256 | Asymmetric cryptographic signing: sign with private key, verify with public key |
| WAL | Write-Ahead Logging — SQLite mode that improves write performance and enables hot backups |
| Zod | TypeScript-first schema validation library used to validate all user input before DB writes |
| RTL | Right-to-Left — text and layout direction used for Arabic |
| ASAR Unpacked | Files excluded from the ASAR archive — required for native Node.js modules (.node files) |
