# Fennec Facturation v3.0 — ERP System

> Desktop ERP application built with Electron, React, and SQLite.
> Version 3.0.0 | Private & Confidential

## Table of Contents
1. [System Requirements](#system-requirements)
2. [First-Time Setup (Developer)](#first-time-setup-developer)
3. [Running in Development](#running-in-development)
4. [Building for Production](#building-for-production)
5. [License System Setup](#license-system-setup)
6. [Deploying to Customer Machine](#deploying-to-customer-machine)
7. [Data Management & Backup](#data-management--backup)
8. [Architecture Overview](#architecture-overview)
9. [Translation & i18n System](#translation--i18n-system)
10. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Development Machine
- Node.js: 18.x or higher
- npm: 9.x or higher
- Operating System: Windows 10+, macOS 12+, or Ubuntu 20.04+
- RAM: 4 GB minimum, 8 GB recommended
- Disk: 2 GB free for development dependencies

### Customer (Production) Machine
- Operating System: Windows 10 64-bit or higher
- RAM: 4 GB minimum
- Disk: 500 MB for installation + space for database growth
- Network: Not required (fully offline application)
- Screen: 1280×720 minimum resolution

---

## First-Time Setup (Developer)

```bash
# 1. Clone the repository
git clone <repository-url>
cd fennec-facturation

# 2. Install dependencies
npm install

# 3. Verify the setup
npm run i18n:audit          # Check all translations are complete
node scripts/preDistCheck.js --staging  # Verify project structure

# 4. Start development
npm run dev                 # Starts Vite dev server + Electron
```

**Development Notes:**
- The application uses a development SQLite database at `userData/database.sqlite`.
  On Windows: `C:\Users\<you>\AppData\Roaming\fennec-facturation\database.sqlite`
- In development mode, DevTools are available via `F12` or `View → Toggle Developer Tools`.
- The license check is enforced even in development. Use a valid test license or
  temporarily bypass the check during development (see License System Setup below).

---

## Running in Development

```bash
npm run dev        # Development mode: Vite + Electron with hot reload
npm run electron   # Run Electron only (after building frontend separately)
npm run build      # Build frontend only (no Electron packaging)
```

---

## Building for Production

```bash
# Full production build and packaging
npm run dist

# Platform-specific
npm run dist:win   # Windows NSIS installer
npm run dist:mac   # macOS DMG

# The built installers are placed in: release/
```

**The `predist` script runs automatically** before packaging.
It checks for security issues, missing translations, and build configuration problems.
All checks must pass before the build proceeds.

---

## License System Setup

The application uses RSA-SHA256 asymmetric cryptography for license verification.
The private key is NEVER stored in the application — only the public key is embedded.

### Generating Keys (One-Time Setup — Operator Only)

Follow the instructions in `KEYGEN_INSTRUCTIONS.md` on a **secure, offline machine**.
After generating the key pair:
1. Embed the public key in `electron/security/publicKey.js`.
2. Store the private key in a secure, offline location (encrypted USB drive, password manager).
3. NEVER commit the private key to version control.

### Issuing a License to a Customer

1. The customer launches the application.
2. On the license screen, they see their **Machine ID**.
3. They send this Machine ID to you.
4. On your secure machine, run the signing command from `KEYGEN_INSTRUCTIONS.md`,
   substituting their Machine ID.
5. Send the resulting **LICENSE TOKEN** string to the customer.
6. The customer pastes the token into the license screen and clicks "Activate".

### Development License Bypass
For development and testing, activate with a valid license generated for your
development machine's Machine ID. The Machine ID is displayed on the activation screen.

---

## Deploying to Customer Machine

1. Run the installer from `release/Fennec Facturation Setup 3.0.0.exe`.
2. Follow the on-screen installation wizard.
3. Launch the application from the Desktop shortcut or Start Menu.
4. Issue and activate the license (see License System Setup above).
5. The application is ready to use.

**Customer Data Location (Windows):**
```
C:\Users\<CustomerName>\AppData\Roaming\fennec-facturation\
├── database.sqlite      ← All ERP data
├── .license             ← Activated license token
├── window-state.json    ← Window size/position preferences
├── last_backup.txt      ← Timestamp of last automatic backup
└── backups/             ← Automatic daily backups (7-day retention)
    ├── backup_2025-03-15_02-00-00.sqlite
    └── ...
```

**Important:** This directory is NOT removed when the application is uninstalled.
Customer data is always preserved across reinstalls and upgrades.

---

## Data Management & Backup

### Automatic Backups
The application automatically creates a backup of the SQLite database every 24 hours.
Backups are stored in the `backups/` directory within the customer's userData folder.
The 7 most recent backups are retained (7-day rolling window).

### Manual Backup
From within the application: **Settings → Data Backup → Backup Now**.

### Restoring from Backup
**Manual restore procedure** (requires technical assistance):
1. Close the application.
2. Navigate to the userData directory.
3. Rename `database.sqlite` to `database.sqlite.corrupted` (keep as safety copy).
4. Copy the desired backup file (e.g., `backups/backup_2025-03-14_02-00-00.sqlite`)
   to the userData directory.
5. Rename the copied file to `database.sqlite`.
6. Launch the application and verify data integrity.

**Note:** A GUI restore feature is planned for a future version.

---

## Architecture Overview

```
fennec-facturation/
├── electron/                    ← Electron main process (Node.js)
│   ├── main.js                  ← App entry: lifecycle only
│   ├── preload.js               ← Secure contextBridge (window.api)
│   ├── ipc/ipcRouter.js         ← All IPC channel registrations
│   ├── controllers/             ← Parameter extraction & response mapping
│   ├── services/                ← Business logic & validation
│   ├── repositories/            ← Database access (SQL)
│   ├── database/                ← DB singleton, schema migrations
│   ├── security/publicKey.js    ← RSA public key (license verification)
│   └── utils/                   ← Logger, window state
│
├── src/                         ← React frontend (renderer process)
│   ├── components/
│   │   ├── ui/                  ← Design system primitives
│   │   ├── layout/              ← App shell, sidebar, navigation
│   │   ├── dashboard/           ← Dashboard-specific components
│   │   └── settings/            ← Settings page panels
│   ├── contexts/                ← React Contexts (Auth, i18n, Data, Settings)
│   ├── hooks/                   ← Custom React hooks
│   ├── pages/                   ← Route-level page components
│   ├── styles/                  ← Global CSS, design tokens, RTL, print
│   ├── utils/                   ← Frontend utilities
│   └── locales/                 ← Translation files (ar.json, fr.json, en.json)
│
├── scripts/
│   ├── i18nAudit.js             ← Verify all translation keys exist
│   └── preDistCheck.js          ← Pre-distribution checklist
│
├── KEYGEN_INSTRUCTIONS.md       ← License key generation (operator reference)
└── KNOWN_ISSUES.md              ← Documented known issues & workarounds
```

### Communication Model
```
React Component
  → window.api.domain.method()       ← Preload (contextBridge)
    → ipcMain.handle('domain:action') ← IPC Router
      → Controller                   ← Parameter sanitization
        → Service                    ← Business logic + Zod validation
          → Repository               ← SQL via better-sqlite3
            → SQLite database        ← WAL mode, foreign keys enabled
```

---

## Translation & i18n System

The application supports three languages:
- **English** (en) — LTR
- **French** (fr) — LTR (default)
- **Arabic** (ar) — RTL

### Translation Files
Located at `src/locales/en.json`, `fr.json`, `ar.json`.

### Adding a New Translation Key
1. Add the key to `en.json` (reference language).
2. Add the equivalent translation to `fr.json`.
3. Add the equivalent translation to `ar.json`.
4. Run `npm run i18n:audit` to verify completeness.

### Translation Key Convention
```json
{
  "nav.dashboard":          "Dashboard",
  "nav.products":           "Products",
  "product.fields.name":    "Product Name",
  "product.validation.nameRequired": "Product name is required",
  "toast.product.created":  "Product created successfully",
  "errors.VALIDATION_ERROR": "Please check your input and try again.",
  "settings.backup.title":  "Data Backup",
  "aria.editProduct":       "Edit product"
}
```
Pattern: `[section].[subsection].[specific]`

---

## Troubleshooting

### Application won't start
- Check that the installation completed without errors.
- Check Windows Event Viewer for application errors.
- Delete `window-state.json` from userData if the window appears off-screen.

### License activation fails with "Machine Mismatch"
- The license was issued for a different machine ID.
- The customer's machine ID may have changed (hardware change, VM migration).
- Issue a new license token for the current machine ID displayed on the activation screen.

### Database corruption (application crashes on launch)
- Follow the manual restore procedure in Data Management & Backup above.
- Always restore from the most recent backup that predates the corruption.

### Arabic text not displaying correctly
- Ensure the Tajawal font has loaded.
- If using offline mode: verify the local font files are in `resources/` within the installation directory.
- Check `Settings → Language` to confirm Arabic is selected.

### Backup "Backup Now" fails
- The userData directory may be on a drive with no free space.
- Check disk space on the drive containing `AppData\Roaming\`.
- Check application logs in `userData/logs/` (if logging to file is configured).
