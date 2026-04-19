# Product Roadmap — Fennec Facturation v3.0 ERP

## Released: v3.0.0 (Current)
Complete ERP foundation with:
- Client, Product, Invoice, Supplier management
- RSA-SHA256 license system with machine binding
- Zod validation + immutable audit log
- Automated daily backups (7-day retention)
- Three-language support (AR/FR/EN) with full RTL
- Luxury UI with design token system
- WCAG 2.1 AA accessibility

---

## v3.1.0 — Stability & Polish (Recommended: 1-3 months post-release)

### Data Quality
- [ ] GUI backup restore (select a backup and restore in-app — no manual file operations)
- [ ] Database integrity checker (run `PRAGMA integrity_check` and surface results in UI)
- [ ] Export all data to Excel (one sheet per entity)

### Performance
- [ ] DataTable virtualization (react-window) for tables with 500+ rows
- [ ] Offline font bundling (embed Tajawal and Inter locally — remove CDN dependency)

### Security & Distribution
- [ ] Windows code signing certificate integration
- [ ] macOS notarization for Gatekeeper compliance
- [ ] Window position boundary validation for multi-monitor setups

### Developer Experience
- [ ] Unit tests for all service layer business logic (Vitest)
- [ ] Integration tests for critical IPC channels
- [ ] Automated test runner in pre-distribution checks

---

## v3.2.0 — Reporting & Intelligence (Recommended: 3-6 months)

### Financial Reports
- [ ] Monthly/quarterly sales report with trend visualization
- [ ] Product performance report (top sellers, slow movers)
- [ ] Client statement (invoice history, payments, outstanding balance)
- [ ] PDF export for all reports (via Electron's `webContents.printToPDF`)

### Inventory Management
- [ ] Low stock alerts with configurable notification system
- [ ] Stock movement history (in/out log per product)
- [ ] Supplier order management (purchase orders)
- [ ] Barcode/QR code scanning support

---

## v4.0.0 — Multi-User & Network (Recommended: 6-12 months)

### Architecture Evolution
- [ ] Optional network mode: SQLite → PostgreSQL migration path
- [ ] Role-based access control (Admin, Cashier, Manager roles)
- [ ] Multi-branch support (separate databases per branch, central reporting)
- [ ] Real-time data sync between branches

### This version requires significant architecture changes:
- The Express server removed in Phase 1 would be reintroduced for network mode.
- Authentication system (JWT) required for multi-user support.
- The Electron frontend becomes one of potentially many clients.

---

## Permanently Deferred

### In-app auto-update (Squirrel/electron-updater)
**Reason:** The license is machine-bound. Auto-updates would need to preserve
the license activation state across updates. This requires careful coordination
between the update mechanism and the license system. Deferred until the license
system is extended to support a server-side activation count.

**Alternative:** Manual updates — provide the customer with a new installer.
Since userData is preserved across uninstall/reinstall, customer data is safe.
