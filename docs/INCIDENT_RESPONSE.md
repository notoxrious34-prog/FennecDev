# Incident Response Guide — Fennec Facturation

## Severity Definitions

| Level | Definition | Response Time |
|-------|-----------|---------------|
| P0 — Critical | Application won't launch, data loss, license system completely broken | Immediate |
| P1 — High | Core feature broken (cannot create invoices), database corruption | Same day |
| P2 — Medium | Non-core feature broken, UI rendering issue, wrong calculation | Next business day |
| P3 — Low | Minor UI issue, translation error, cosmetic problem | Next release |

---

## P0: Application Won't Launch

### Symptoms
Customer reports the application crashes immediately, shows a white screen, or
the window opens and closes instantly.

### Diagnostic Steps
```powershell
# 1. Check the most recent log file
$log = "$env:APPDATA\fennec-facturation\logs"
Get-ChildItem $log | Sort Name -Desc | Select -First 1 | Get-Content | Select -Last 50
```

### Common Causes & Fixes

**Cause: Database file corrupted**
```
Log contains: "SQLITE_CORRUPT" or "database disk image is malformed"
Fix: Restore from backup (see Runbook Section 4.3)
```

**Cause: License file corrupted**
```
Log contains: "License parse failed" or "JSON parse error"
Fix:
1. Delete userData/.license
2. Application will show license activation screen
3. Re-issue a license token for the customer's machine ID
```

**Cause: userData directory permissions**
```
Log contains: "EACCES" or "EPERM" accessing userData
Fix:
1. Right-click the userData directory → Properties → Security
2. Ensure the current Windows user has Full Control
3. If on a managed corporate machine: contact IT to grant permissions
```

**Cause: Electron binary corrupted**
```
No log file created at all (logger never initialized)
Fix: Uninstall and reinstall from the v3.0.1 installer
     Verify installer SHA256 matches: [checksum from SHA256SUMS.txt]
```

---

## P0: License Activation Fails for All Customers

### Symptoms
Every new activation attempt fails with INVALID_SIGNATURE, even with freshly
generated tokens.

### Diagnostic Steps
```bash
# Verify the public key in the deployed application matches the private key used for signing
node -e "const crypto=require('crypto');const fs=require('fs');const publicKeyModule=require('./electron/security/publicKey');const publicKey=publicKeyModule.PUBLIC_KEY;const tokenString=fs.readFileSync('fennec-facturation.license','utf8');const token=JSON.parse(tokenString);const payload=token.payload;const signature=token.signature;const payloadString=JSON.stringify(payload);const verify=crypto.createVerify('SHA256');verify.update(payloadString);verify.end();const isValid=verify.verify(publicKey,signature,'base64');console.log('Valid:',isValid);"
# If this shows false, the public/private key pair is mismatched
```

### Root Cause
The public key embedded in the application does not match the private key used by
`tools/issueLicense.js`. This occurs if:
- A new key pair was generated but only one side was updated
- The wrong private key file was used for signing
- The public key in `publicKey.js` was corrupted during copy-paste

### Fix
```bash
# 1. Verify the public key currently embedded in the app:
node -e "const crypto=require('crypto');const pk=require('./electron/security/publicKey').PUBLIC_KEY;const ko=crypto.createPublicKey(pk);console.log('Type:', ko.asymmetricKeyType, 'Size:', ko.asymmetricKeyDetails?.modulusLength, 'bits');"

# 2. Re-extract the public key from your private key (if using OpenSSL):
# openssl rsa -in fennec_license_private_encrypted.pem -pubout -out new_public.pem
# cat new_public.pem

# 3. Compare with what's in electron/security/publicKey.js
# They must be identical.

# 4. If different: embed the correct public key, rebuild, and re-release
# See: Action Prompt 1, Phase 2

# 5. If the private key itself is lost: generate a new key pair.
# This invalidates ALL previously issued licenses — all customers need new tokens.
# This is a catastrophic event. Prevent it with proper key backup.
```

---

## P1: Database Corruption

### Symptoms
Application launches but crashes when accessing specific data, or shows
"database disk image is malformed" errors in logs.

### Immediate Action
```powershell
# 1. Close the application immediately
# 2. Make a copy of the current (possibly corrupted) database before any repair attempt
$userData = "$env:APPDATA\fennec-facturation"
Copy-Item "$userData\database.sqlite" "$userData\database.sqlite.incident-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# 3. Run SQLite integrity check
sqlite3 "$userData\database.sqlite" "PRAGMA integrity_check;" | head -20
# If result is not "ok": database is corrupt
```

### Recovery
Follow the manual restore procedure in the Runbook (Section 4.3).
If no backup predates the corruption: the incident copy may be partially recoverable
using SQLite's recovery mode — contact the Primary Developer.

---

## P1: Backup System Failure

### Symptoms
Customer reports no backups being created, or the Backup Now button shows an error.

### Diagnostic Steps
```powershell
# Check last backup timestamp
Get-Content "$env:APPDATA\fennec-facturation\last_backup.txt"

# Check backup directory
Get-ChildItem "$env:APPDATA\fennec-facturation\backups\" | Sort Name -Desc | Select -First 5

# Check logs for backup errors
$log = Get-ChildItem "$env:APPDATA\fennec-facturation\logs\" | Sort Name -Desc | Select -First 1
Get-Content $log | ConvertFrom-Json | Where-Object { $_.level -eq 'ERROR' -and $_.message -like '*backup*' }
```

### Common Causes
- **Disk full**: Check free space on the drive containing AppData
- **Permissions**: The backups/ directory may have restricted permissions
- **Antivirus**: Real-time scanning locking the .sqlite file during backup
  (Add userData directory to AV exclusions)

---

## P2: Wrong Calculation in Invoice

### Symptoms
Invoice total does not match expected value based on line items, quantities, and tax.

### Diagnostic Steps
```bash
# Check the audit log for the invoice in question
# In the application: Settings → Audit Trail → filter by Entity: Invoices, ID: <invoice_id>
# The CREATE entry shows the exact payload stored in the database

# Directly query the database:
sqlite3 "$env:APPDATA\fennec-facturation\database.sqlite"
SELECT * FROM invoices WHERE id = <invoice_id>;
SELECT * FROM invoice_lines WHERE invoiceId = <invoice_id>;
```

### Resolution
If the calculation is wrong in the database: this is a bug in `invoiceService.js`.
The business logic for totals lives there. File a bug report with:
- The invoice ID
- The line items (product, quantity, unit price, discount)
- The tax rate
- The expected total vs. the actual total stored

---

## Collecting Diagnostics from a Customer

When a customer reports any issue, request:
```
1. The application log file:
   Location: C:\Users\<their_username>\AppData\Roaming\fennec-facturation\logs\
   File: app-<today's date>.log and app-<yesterday's date>.log

2. A screenshot of the error message (if any visible in the UI)

3. The exact steps they took before the error occurred

4. Their application version (visible in Settings → General or About)

5. Their Machine ID (visible on the license activation screen or Settings → License)
```
