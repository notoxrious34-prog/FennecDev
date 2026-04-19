#!/usr/bin/env node
/**
 * Pre-distribution verification script — Fennec Facturation v3.0 ERP
 *
 * Usage:
 *   node scripts/preDistCheck.js           # Full production check
 *   node scripts/preDistCheck.js --staging  # Skip checks requiring real keys
 *   node scripts/preDistCheck.js --verbose  # Show additional detail
 *
 * Exit code:
 *   0 — All checks passed
 *   1 — One or more checks failed
 */

const fs            = require('fs');
const path          = require('path');
const { execSync }  = require('child_process');

const ROOT      = path.join(__dirname, '..');
const isStaging = process.argv.includes('--staging');
const isVerbose = process.argv.includes('--verbose');

let passed = 0;
let failed = 0;
let skipped = 0;
const failures = [];

// ── Utility Functions ──────────────────────────────────────────────────────

const log = (msg) => isVerbose && console.log(`  [verbose] ${msg}`);

const check = (label, fn, { skip = false, critical = false } = {}) => {
  if (skip) {
    console.log(`  ⏭  ${label} (skipped)`);
    skipped++;
    return;
  }
  try {
    const result = fn();
    if (result === true || result === undefined) {
      console.log(`  ✅ ${label}`);
      passed++;
    } else {
      const msg = typeof result === 'string' ? result : 'Check failed';
      console.error(`  ❌ ${label}`);
      console.error(`     └─ ${msg}`);
      failed++;
      failures.push({ label, msg, critical });
    }
  } catch (err) {
    console.error(`  ❌ ${label}`);
    console.error(`     └─ ${err.message}`);
    failed++;
    failures.push({ label, msg: err.message, critical });
  }
};

const fileExists   = (rel) => fs.existsSync(path.join(ROOT, rel));
const fileContains = (rel, str) => {
  try { return fs.readFileSync(path.join(ROOT, rel), 'utf8').includes(str); }
  catch { return false; }
};
const fileNotContains = (rel, str) => !fileContains(rel, str);
const grepDir = (pattern, dir = '.', include = '*.{js,ts,tsx,json}') => {
  try {
    return execSync(
      `grep -r "${pattern}" ${dir} --include="${include}" ` +
      `--exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist 2>/dev/null || true`,
      { cwd: ROOT, encoding: 'utf8' }
    ).trim();
  } catch { return ''; }
};

// ── Check Groups ───────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════╗');
console.log('║   Fennec Facturation v3.0 — Pre-Distribution Checks ║');
console.log(`║   Mode: ${isStaging ? 'STAGING' : 'PRODUCTION'}${' '.repeat(43 - (isStaging ? 7 : 10))}║`);
console.log('╚══════════════════════════════════════════════════════╝\n');

// ── 1. SECURITY ────────────────────────────────────────────────────────────
console.log('1. Security\n');

check('No RSA private key in repository', () => {
  const result = grepDir('BEGIN RSA PRIVATE KEY');
  return result === '' || `Private key material found:\n     ${result}`;
}, { critical: true });

check('No keygen references in source', () => {
  const result = grepDir('keygen', 'electron src');
  return result === '' || `Keygen references found:\n     ${result}`;
}, { critical: true });

check('Public key is not a placeholder', () => {
  if (isStaging) return true;
  return fileNotContains('electron/security/publicKey.js', 'REPLACE_WITH_ACTUAL')
    || 'Public key placeholder found — replace with actual RSA public key';
}, { skip: isStaging });

check('No hardcoded secrets or passwords', () => {
  const patterns = ['password.*=.*["\'][^"\']{8}', 'api.key.*=.*["\']', 'secret.*=.*["\']'];
  for (const p of patterns) {
    const result = grepDir(p, 'src electron');
    if (result !== '') return `Potential secret found (pattern: ${p}):\n     ${result}`;
  }
  return true;
}, { critical: true });

check('.env files not committed', () => {
  const envFiles = ['.env', '.env.production', '.env.local'];
  for (const f of envFiles) {
    if (fileExists(f)) {
      try {
        execSync(`git ls-files --error-unmatch ${f}`, { cwd: ROOT, stdio: 'pipe' });
        return `${f} is tracked by git — add to .gitignore and remove with: git rm --cached ${f}`;
      } catch { /* Not tracked — OK */ }
    }
  }
  return true;
});

// ── 2. ELECTRON SECURITY CONFIG ────────────────────────────────────────────
console.log('\n2. Electron Security Configuration\n');

check('contextIsolation: true in main.js', () =>
  fileContains('main.js', 'contextIsolation: true')
  || 'contextIsolation must be true — critical security requirement'
, { critical: true });

check('nodeIntegration: false in main.js', () =>
  fileContains('main.js', 'nodeIntegration: false')
  || 'nodeIntegration must be false — critical security requirement'
, { critical: true });

check('webSecurity enabled (not disabled)', () =>
  !fileContains('main.js', 'webSecurity: false')
  || 'webSecurity: false found — remove this for production'
, { critical: true });

check('DevTools blocked in production', () =>
  fileContains('main.js', 'app.isPackaged')
  || 'DevTools must be conditionally disabled based on app.isPackaged'
);

check('Navigation restriction implemented', () =>
  fileContains('main.js', 'will-navigate')
  || 'Add will-navigate handler to prevent navigation to external URLs'
);

check('Single instance lock implemented', () =>
  fileContains('main.js', 'requestSingleInstanceLock')
  || 'Single instance lock missing — multiple ERP instances can run simultaneously'
);

// ── 3. ARCHITECTURE ────────────────────────────────────────────────────────
console.log('\n3. Architecture Integrity\n');

const requiredFiles = [
  'main.js',
  'electron/preload.js',
  'electron/ipc/ipcRouter.js',
  'electron/database/db.js',
  'electron/repositories/baseRepository.js',
  'electron/services/licenseService.js',
  'electron/services/backupService.js',
  'electron/services/auditService.js',
];

requiredFiles.forEach(file => {
  check(`File exists: ${file}`, () =>
    fileExists(file) || `Missing required file: ${file}`
  );
});

check('No direct DB imports outside repositories', () => {
  const result = grepDir("require.*database/db", 'electron/controllers electron/services');
  return result === '' || `Direct DB imports found outside repositories:\n     ${result}`;
});

check('No SQL strings outside repositories', () => {
  const result = grepDir('SELECT.*FROM\\|INSERT INTO\\|UPDATE.*SET\\|DELETE FROM',
    'electron/controllers electron/services');
  return result === '' || `SQL found outside repository layer:\n     ${result}`;
});

check('No ipcMain.handle outside ipcRouter', () => {
  const files = ['main.js', 'electron/preload.js'];
  for (const f of files) {
    if (fileContains(f, 'ipcMain.handle')) {
      return `ipcMain.handle found in ${f} — must only be in ipcRouter.js`;
    }
  }
  return true;
});

// ── 4. BUILD ───────────────────────────────────────────────────────────────
console.log('\n4. Build Output\n');

check('dist/ directory exists', () =>
  fileExists('dist') || 'Run npm run build before npm run dist'
);

check('dist/index.html exists', () =>
  fileExists('dist/index.html') || 'Frontend build output missing'
);

check('dist/index.html uses relative paths', () => {
  if (!fileExists('dist/index.html')) return 'dist/index.html not found';
  const html = fs.readFileSync(path.join(ROOT, 'dist/index.html'), 'utf8');
  const absoluteRefs = html.match(/(?:src|href)="\/[^/]/g) || [];
  return absoluteRefs.length === 0
    || `Absolute paths found: ${absoluteRefs.slice(0, 3).join(', ')} — check vite.config base: './'`;
});

check('No source maps in dist/', () => {
  try {
    const maps = execSync('find dist/ -name "*.map" 2>/dev/null || true',
      { cwd: ROOT, encoding: 'utf8' }).trim();
    return maps === '' || `Source maps found: ${maps.split('\n').slice(0, 3).join(', ')}`;
  } catch { return true; }
});

check('Zod not imported in React frontend', () => {
  const result = grepDir("from 'zod'", 'src');
  return result === '' || `Zod imported in frontend (should only be in electron/):\n     ${result}`;
});

// ── 5. PACKAGING CONFIGURATION ─────────────────────────────────────────────
console.log('\n5. Packaging Configuration\n');

check('electron-builder.yml exists', () =>
  fileExists('electron-builder.yml') || 'electron-builder.yml required for distribution'
);

check('asar: true in electron-builder.yml', () =>
  fileContains('electron-builder.yml', 'asar: true')
  || 'Set asar: true for production source code protection'
);

check('better-sqlite3 in asarUnpack', () =>
  fileContains('electron-builder.yml', 'better-sqlite3')
  || 'better-sqlite3 is a native module and must be in asarUnpack'
);

check('node-machine-id in asarUnpack', () =>
  fileContains('electron-builder.yml', 'node-machine-id')
  || 'node-machine-id is a native module and must be in asarUnpack'
);

// ── 6. PACKAGE METADATA ────────────────────────────────────────────────────
console.log('\n6. Package Metadata\n');

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

check('productName is set', () =>
  !!pkg.productName || 'Add productName to package.json'
);
check('version follows semver', () => {
  return /^\d+\.\d+\.\d+/.test(pkg.version) || `Invalid version: ${pkg.version}`;
});
check('author is set', () => !!pkg.author || 'Add author to package.json');
check('private: true', () => pkg.private === true || 'Add "private": true to prevent accidental npm publish');
check('main points to main.js', () =>
  pkg.main === 'main.js' || `main should be 'main.js', got '${pkg.main}'`
);

// ── 7. INTERNATIONALIZATION ────────────────────────────────────────────────
console.log('\n7. Internationalization\n');

check('All translation keys present (i18nAudit)', () => {
  try {
    execSync('node scripts/i18nAudit.js', { cwd: ROOT, stdio: 'pipe' });
    return true;
  } catch (err) {
    return `Missing translation keys detected. Run: npm run i18n:audit\n     ${err.stderr?.toString().slice(0, 200)}`;
  }
}, { skip: isStaging });

check('Arabic locale file exists', () =>
  fileExists('src/locales/ar.json') || 'Arabic translations missing'
);
check('French locale file exists', () =>
  fileExists('src/locales/fr.json') || 'French translations missing'
);
check('English locale file exists', () =>
  fileExists('src/locales/en.json') || 'English translations missing'
);

// ── 8. DOCUMENTATION ───────────────────────────────────────────────────────
console.log('\n8. Documentation\n');

check('README.md exists', () => fileExists('README.md'));
check('CHANGELOG.md exists', () => fileExists('CHANGELOG.md'));
check('KEYGEN_INSTRUCTIONS.md exists', () => fileExists('KEYGEN_INSTRUCTIONS.md'));
check('KNOWN_ISSUES.md exists', () => fileExists('KNOWN_ISSUES.md'));

// ── SUMMARY ────────────────────────────────────────────────────────────────

const total = passed + failed + skipped;
console.log('\n' + '═'.repeat(56));
console.log(` Results: ${passed} passed, ${failed} failed, ${skipped} skipped / ${total} total`);

if (failed > 0) {
  console.log('\n CRITICAL FAILURES:');
  failures.filter(f => f.critical).forEach(f =>
    console.error(`  🚨 ${f.label}: ${f.msg}`)
  );

  if (failures.some(f => !f.critical)) {
    console.log('\n OTHER FAILURES:');
    failures.filter(f => !f.critical).forEach(f =>
      console.error(`  ❌ ${f.label}: ${f.msg}`)
    );
  }

  console.error('\n❌ Pre-distribution checks FAILED.');
  console.error('   Fix all issues above before running npm run dist.\n');
  process.exit(1);
} else {
  console.log(`\n✅ All checks passed${skipped > 0 ? ` (${skipped} skipped for staging mode)` : ''}.`);
  console.log('   Safe to build distribution package.\n');
  process.exit(0);
}
