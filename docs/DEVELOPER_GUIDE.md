# Developer Guide — Fennec Facturation v3.0 ERP

## Setting Up Your Development Environment

### Prerequisites
```bash
node --version   # Must be >= 18.0.0
npm --version    # Must be >= 9.0.0
```

### Clone and Install
```bash
git clone <repository-url>
cd fennec-facturation
npm install           # Install exact versions from package-lock.json
```

### Development License
The license system is active in development. To work without issuing yourself a license:
1. Get your machine ID: launch the app and read the activation screen, OR:
   ```javascript
   // Temporary: add to electron/main.js during development
   const { machineIdSync } = require('node-machine-id');
   console.log('DEV MACHINE ID:', machineIdSync());
   ```
2. Generate a license token for your machine ID using `KEYGEN_INSTRUCTIONS.md`.
3. Place the token in `userData/.license` for seamless development launches.

---

## Adding a New Feature

### 1. Backend: Add IPC Channel
Every new feature follows this pattern exactly:

**Step A — Add Repository method** (`electron/repositories/entityRepository.js`):
```javascript
// Use prepared statements ONLY — no string interpolation
findByNewCriteria(criteria) {
  return this.db.prepare(
    'SELECT * FROM entity WHERE column = ? ORDER BY name'
  ).all(criteria);
}
```

**Step B — Add Service method** (`electron/services/entityService.js`):
```javascript
// 1. Validate input with Zod
// 2. Call repository
// 3. Log to audit if mutating data
// 4. Return standardized envelope
async newFeature(rawData) {
  const validation = validate(EntitySchema, rawData);
  if (!validation.success) return validation;

  try {
    const result = this.entityRepository.findByNewCriteria(validation.data.criteria);
    await this.auditService.logAction({ action: 'READ_SENSITIVE', entity: 'entity', ... });
    return { success: true, data: result };
  } catch (error) {
    logger.error('entityService.newFeature failed', error);
    return { success: false, error: { code: 'DB_ERROR', message: error.message } };
  }
}
```

**Step C — Add Controller method** (`electron/controllers/entityController.js`):
```javascript
// Extract args, call service, return result — nothing else
async newFeature(event, args) {
  const { criteria } = args || {};
  if (!criteria) return { success: false, error: { code: 'MISSING_ARGS', message: 'criteria is required' } };
  return this.entityService.newFeature({ criteria });
}
```

**Step D — Register IPC channel** (`electron/ipc/ipcRouter.js`):
```javascript
ipcMain.handle('entity:newFeature', (event, args) =>
  entityController.newFeature(event, args)
);
```

**Step E — Expose on preload** (`electron/preload.js`):
```javascript
entity: {
  // ... existing methods
  newFeature: (args) => ipcRenderer.invoke('entity:newFeature', args),
}
```

### 2. Frontend: Consume the IPC Channel

**Step F — Call from React component**:
```typescript
const result = await window.api.entity.newFeature({ criteria: 'value' });
if (result.success) {
  // Handle data
} else {
  showToast('error', getErrorMessage(result.error, t));
}
```

---

## Adding a New Translation Key

1. Add to `src/locales/en.json` (always start with English as reference).
2. Add to `src/locales/fr.json`.
3. Add to `src/locales/ar.json`.
4. Run `npm run i18n:audit` — must exit 0.

**Naming convention:** `section.subsection.specific`
```json
{
  "inventory.lowStock.title":   "Low Stock Alert",
  "inventory.lowStock.message": "{{count}} products are below minimum stock threshold"
}
```

---

## Code Standards

### TypeScript / React
- All new React components: TypeScript (`.tsx`).
- All new Electron files: JavaScript (`.js`) — Node.js compatibility.
- No `any` types in TypeScript. Use `unknown` and narrow.
- All async operations have cancellation flags in `useEffect`.
- No `console.log` in committed code — use `logger` in Electron, `console.warn` for i18n misses only.

### CSS
- All values use CSS custom properties from `design-system.css`.
- All directional properties use logical equivalents (`margin-inline-start` not `margin-left`).
- All new animations wrapped in `@media (prefers-reduced-motion: no-preference)`.

### Git Commit Convention
```
feat(products): add batch import from CSV
fix(invoice): correct total calculation with compound discounts
refactor(audit): extract payload serialization to utility
docs(readme): update deployment instructions
style(button): adjust loading spinner size to match design spec
```

---

## Running Tests

```bash
npm run i18n:audit          # Verify translation completeness
node scripts/preDistCheck.js --staging  # Verify project structure
npm run build               # Verify frontend builds without errors
```

*Unit and integration tests: planned for v3.1.0.*

---

## Release Process

1. Update version in `package.json`.
2. Add release notes to `CHANGELOG.md`.
3. Ensure public key in `electron/security/publicKey.js` is not a placeholder.
4. Run: `npm run dist`
5. Test the installer on a clean machine.
6. Tag the release in version control: `git tag v3.0.0`.
7. Archive the `release/` directory securely.
