# Changelog — Fennec Facturation v3.0 ERP

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [3.0.0] — 2025-04-19 — Initial Release

### Added — Architecture
- Complete layered Electron architecture: Controllers → Services → Repositories
- Single database connection singleton with WAL mode and foreign key enforcement
- Secure IPC communication via contextBridge (contextIsolation: true, nodeIntegration: false)
- Dependency injection throughout the service layer
- Structured error responses: `{ success, data/error }` envelope on all IPC channels

### Added — Security
- RSA-SHA256 asymmetric license verification system
- Machine ID binding via `node-machine-id`
- Boot guard: application blocked at startup without valid license
- Complete removal of all previous Keygen-related code
- Navigation restriction preventing URL hijacking
- Content Security Policy headers
- Single instance lock to prevent multiple app instances

### Added — Data Integrity
- Zod schema validation on all create/update operations in service layer
- Immutable audit log tracking all CRUD operations (CREATE, UPDATE, DELETE)
- Before/After payload capture for UPDATE operations
- Automated daily SQLite backup with 7-day retention
- Hot-backup via `better-sqlite3`'s native `.backup()` API
- Performance indexes on high-frequency query columns

### Added — User Interface
- Luxury dark theme with accent color system
- Complete design token system (CSS custom properties)
- RTL support via CSS logical properties for Arabic language
- Three-language support: English, French, Arabic (Tajawal font)
- Floating label form inputs with Zod error integration
- Polymorphic Button component (5 variants, 4 sizes, loading state)
- DataTable with sorting, sticky header, empty states, row actions
- Skeleton loading states replacing all spinners
- Toast notification system (4 types, stacking, progress bar, RTL-aware)
- Page transition animations
- KPI counter animations on dashboard
- Print stylesheet for invoices (LTR and RTL)
- Settings page with Backup and Audit Trail panels
- Audit detail drawer with Before/After JSON diff view
- CSV export with UTF-8 BOM for Excel Arabic compatibility
- WCAG 2.1 AA accessibility compliance
- Focus trap and Escape key handling for all modals
- Reduced motion support via `prefers-reduced-motion`

### Added — Developer Experience
- `scripts/i18nAudit.js` — verify translation completeness
- `scripts/preDistCheck.js` — automated pre-distribution checklist
- `KEYGEN_INSTRUCTIONS.md` — license key generation guide
- `KNOWN_ISSUES.md` — documented known limitations
- Code splitting (react-vendor, ui-vendor chunks)

### Security
- Removed all Keygen logic from application codebase
- RSA private key is never stored in the repository
- ASAR packaging for source code obfuscation
- DevTools disabled in production builds

---

## [Unreleased] — Planned for v3.1.0

- Local font bundling (removes Google Fonts CDN dependency — offline operation)
- DataTable virtualization for large datasets (react-window)
- Window position boundary validation for multi-monitor setups
- Code signing for Windows and macOS installers
- GUI backup restore functionality
- Report generation and PDF export
- Multi-user support with role-based access control
