#!/usr/bin/env node
/**
 * i18n Audit Script — Fennec Facturation
 *
 * Verifies that all translation keys are present in all language files.
 * Uses JSON.parse for reliable key extraction — no regex parsing.
 *
 * Usage:
 *   node scripts/i18nAudit.js              # Standard audit
 *   node scripts/i18nAudit.js --verbose    # Show all keys, not just missing
 *   node scripts/i18nAudit.js --summary    # Show counts only, no key detail
 *
 * Exit codes:
 *   0 — All keys present in all languages
 *   1 — One or more keys missing
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── Configuration ──────────────────────────────────────────────────────────

// Adjust this path if your locale files are in a different directory
const LOCALES_DIR = path.join(process.cwd(), 'src', 'locales');

const LANGUAGES = ['en', 'fr', 'ar'];

// Keys intentionally allowed to be missing in specific languages.
// Add entries here ONLY with explicit justification.
// Format: { key: 'some.key', missingIn: ['ar'], reason: 'Not applicable in RTL' }
const INTENTIONAL_EXCEPTIONS = [
  // Example (remove if not applicable):
  // { key: 'print.pageOf', missingIn: ['ar'], reason: 'Print layout differs in RTL' },
];

const isVerbose = process.argv.includes('--verbose');
const isSummary = process.argv.includes('--summary');

// ── Key Extraction ─────────────────────────────────────────────────────────

/**
 * Recursively flattens a nested JSON object into dot-notation keys.
 * For flat JSON: { "key": "value" } → ["key"]
 * For nested JSON: { "a": { "b": "value" } } → ["a.b"]
 *
 * This handles BOTH flat and nested translation file structures.
 */
function flattenKeys(obj, prefix = '', result = []) {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      flattenKeys(value, fullKey, result);
    } else {
      result.push(fullKey);
    }
  }
  return result;
}

/**
 * Gets the value of a dot-notation key from a (potentially nested) object.
 * For flat JSON: getValue(obj, 'key') === obj['key']
 * For nested JSON: getValue(obj, 'a.b') === obj.a.b
 */
function getValue(obj, dotKey) {
  // First try direct lookup (for flat JSON)
  if (dotKey in obj) {
    return obj[dotKey];
  }
  // Fall back to nested lookup (for nested JSON)
  return dotKey.split('.').reduce((current, segment) => {
    return current !== undefined && current !== null ? current[segment] : undefined;
  }, obj);
}

// ── Load Translation Files ─────────────────────────────────────────────────

const translations = {};
const loadErrors = [];

for (const lang of LANGUAGES) {
  const filePath = path.join(LOCALES_DIR, `${lang}.json`);
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    translations[lang] = JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') {
      loadErrors.push(`Translation file not found: ${filePath}`);
    } else if (err instanceof SyntaxError) {
      loadErrors.push(`Invalid JSON in ${lang}.json: ${err.message}`);
    } else {
      loadErrors.push(`Failed to load ${lang}.json: ${err.message}`);
    }
    translations[lang] = {};
  }
}

if (loadErrors.length > 0) {
  console.error('\n❌ FATAL: Could not load translation files:');
  loadErrors.forEach(e => console.error('  ', e));
  process.exit(1);
}

// ── Build Master Key List ─────────────────────────────────────────────────

// The master key list is the UNION of all keys across all languages.
// This means a key present in ANY language file will be checked in ALL others.
const masterKeys = [...new Set(LANGUAGES.flatMap(lang => flattenKeys(translations[lang])))].sort();

// ── Run the Audit ──────────────────────────────────────────────────────────

console.log('\n╔═══════════════════════════════════════════════════╗');
console.log('║   Fennec Facturation — i18n Translation Audit    ║');
console.log('╚═══════════════════════════════════════════════════╝\n');

// Print file stats
LANGUAGES.forEach(lang => {
  const count = flattenKeys(translations[lang]).length;
  console.log(`  ${lang.toUpperCase()}: ${count} keys in ${lang}.json`);
});
console.log(`  TOTAL unique keys: ${masterKeys.length}\n`);

// Find missing keys
const missingReport = {}; // { 'key': ['ar', 'fr'] }
const emptyReport   = {}; // { 'key': ['ar'] } — key exists but value is empty string

for (const key of masterKeys) {
  // Check intentional exceptions
  const exception = INTENTIONAL_EXCEPTIONS.find(e => e.key === key);

  for (const lang of LANGUAGES) {
    // Skip intentionally excepted combinations
    if (exception?.missingIn?.includes(lang)) continue;

    const value = getValue(translations[lang], key);

    if (value === undefined || value === null) {
      // Key is completely missing
      if (!missingReport[key]) missingReport[key] = [];
      missingReport[key].push(lang);
    } else if (typeof value === 'string' && value.trim() === '') {
      // Key exists but has an empty value
      if (!emptyReport[key]) emptyReport[key] = [];
      emptyReport[key].push(lang);
    }
  }
}

// ── Report Results ─────────────────────────────────────────────────────────

const missingKeys   = Object.keys(missingReport);
const emptyKeys     = Object.keys(emptyReport);
const hasErrors     = missingKeys.length > 0;
const hasWarnings   = emptyKeys.length > 0;

// MISSING KEYS (Errors)
if (missingKeys.length > 0) {
  console.error(`❌ MISSING KEYS (${missingKeys.length}):\n`);
  for (const key of missingKeys) {
    const langs = missingReport[key];
    console.error(`  ${key}`);
    console.error(`    Missing in: [${langs.join(', ')}]`);

    // Show the value from languages where it DOES exist (helpful for translators)
    if (!isSummary) {
      for (const lang of LANGUAGES) {
        if (!langs.includes(lang)) {
          const existingValue = getValue(translations[lang], key);
          console.error(`    ${lang.toUpperCase()} value: "${existingValue}"`);
        }
      }
    }
    console.error();
  }
} else {
  console.log('✅ No missing keys\n');
}

// EMPTY KEYS (Warnings)
if (emptyKeys.length > 0) {
  console.warn(`⚠️  EMPTY VALUES (${emptyKeys.length}) — keys exist but have no content:\n`);
  for (const key of emptyKeys) {
    const langs = emptyReport[key];
    console.warn(`  ${key} — empty in: [${langs.join(', ')}]`);
  }
  console.warn();
}

// VERBOSE: Show all keys
if (isVerbose && !hasErrors) {
  console.log('All keys (verbose mode):\n');
  masterKeys.forEach(key => {
    console.log(`  ✅ ${key}`);
    LANGUAGES.forEach(lang => {
      const value = getValue(translations[lang], key);
      console.log(`     ${lang}: "${value}"`);
    });
  });
}

// INTENTIONAL EXCEPTIONS (Info)
if (INTENTIONAL_EXCEPTIONS.length > 0) {
  console.log(`ℹ️  Intentional exceptions (${INTENTIONAL_EXCEPTIONS.length}):`);
  INTENTIONAL_EXCEPTIONS.forEach(e => {
    console.log(`  ${e.key} — missing in [${e.missingIn.join(', ')}]: ${e.reason}`);
  });
  console.log();
}

// DUPLICATE KEY CHECK
const duplicateReport = {};
for (const lang of LANGUAGES) {
  const raw = fs.readFileSync(path.join(LOCALES_DIR, `${lang}.json`), 'utf8');
  const seen = new Set();
  const duplicates = [];

  // This regex finds top-level keys — sufficient for flat JSON
  // For nested JSON, duplicate keys within a nested object would need a parser
  for (const match of raw.matchAll(/"([^"]+)"\s*:/g)) {
    const key = match[1];
    if (seen.has(key)) duplicates.push(key);
    seen.add(key);
  }

  if (duplicates.length > 0) {
    duplicateReport[lang] = duplicates;
    console.error(`❌ DUPLICATE KEYS in ${lang}.json:`, duplicates);
  }
}
const hasDuplicates = Object.keys(duplicateReport).length > 0;

// ── Summary ────────────────────────────────────────────────────────────────

console.log('─'.repeat(51));

if (!hasErrors && !hasDuplicates) {
  console.log(`\n✅ All ${masterKeys.length} keys present in all ${LANGUAGES.length} languages.`);
  if (hasWarnings) {
    console.warn(`   ⚠️  ${emptyKeys.length} keys have empty values — review before release.`);
  }
  if (INTENTIONAL_EXCEPTIONS.length > 0) {
    console.log(`   ℹ️  ${INTENTIONAL_EXCEPTIONS.length} intentional exceptions documented.`);
  }
  console.log();
  process.exit(0);
} else {
  console.error(`\n❌ Audit FAILED:`);
  if (missingKeys.length > 0) console.error(`   ${missingKeys.length} missing keys`);
  if (hasDuplicates) console.error(`   Duplicate keys detected`);
  console.error(`   Fix all issues above before proceeding to production build.\n`);
  process.exit(1);
}
