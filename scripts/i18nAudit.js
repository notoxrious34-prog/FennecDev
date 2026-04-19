/**
 * i18n Audit Script
 *
 * This script audits the translation files for:
 * - Missing keys across languages
 * - Unused keys (keys defined but not used in codebase)
 * - Inconsistent key structures
 *
 * Usage: node scripts/i18nAudit.js
 */

const fs = require('fs');
const path = require('path');

const TRANSLATIONS_FILE = path.join(__dirname, '../src/i18n/translations.ts');
const SRC_DIR = path.join(__dirname, '../src');

// Parse translations from TypeScript file
function parseTranslations(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Extract the translations object using regex
  const match = content.match(/export const translations = \{([\s\S]+)\};/);
  if (!match) {
    console.error('Could not parse translations file');
    process.exit(1);
  }

  const languages = ['ar', 'fr', 'en'];
  const translations = {};

  for (const lang of languages) {
    const langMatch = content.match(new RegExp(`${lang}: \\{([\\s\\S]*?)\\},`));
    if (langMatch) {
      const keys = extractKeys(langMatch[1]);
      translations[lang] = keys;
    }
  }

  return translations;
}

function extractKeys(block) {
  const keys = {};
  const lines = block.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Match key: 'value' or key: "value" - flat structure
    const match = trimmed.match(/^([a-zA-Z0-9_]+):\s*['"`](.+)['"`]\s*,?$/);
    if (match) {
      const [, key, value] = match;
      keys[key] = value;
    }
  }

  return keys;
}

// Find all translation keys used in the codebase
function findUsedKeys(dir) {
  const keys = new Set();

  function scanDirectory(directory) {
    const files = fs.readdirSync(directory);

    for (const file of files) {
      const filePath = path.join(directory, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) {
        scanDirectory(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
        const content = fs.readFileSync(filePath, 'utf8');

        // Find t('key') or t("key") patterns
        const matches = content.match(/t\(['"`]([^'"`]+)['"`]\)/g);
        if (matches) {
          for (const match of matches) {
            const key = match.match(/t\(['"`]([^'"`]+)['"`]\)/)[1];
            keys.add(key);
          }
        }
      }
    }
  }

  scanDirectory(dir);
  return keys;
}

function main() {
  console.log('🔍 Starting i18n Audit...\n');

  // Parse translations
  const translations = parseTranslations(TRANSLATIONS_FILE);

  // Find used keys in codebase
  console.log('📂 Scanning codebase for translation usage...');
  const usedKeys = findUsedKeys(SRC_DIR);
  console.log(`   Found ${usedKeys.size} translation keys used in code\n`);

  // Get translation keys for each language
  const allDefinedKeys = {};
  for (const lang in translations) {
    allDefinedKeys[lang] = new Set(Object.keys(translations[lang]));
    console.log(`📝 ${lang.toUpperCase()}: ${allDefinedKeys[lang].size} keys defined`);
  }
  console.log('');

  // Check for missing keys across languages
  console.log('⚠️  MISSING KEYS (keys defined in one language but not others):\n');
  const allKeys = new Set();
  for (const lang in allDefinedKeys) {
    for (const key of allDefinedKeys[lang]) {
      allKeys.add(key);
    }
  }

  let hasMissing = false;
  for (const key of allKeys) {
    const missingIn = [];
    for (const lang in allDefinedKeys) {
      if (!allDefinedKeys[lang].has(key)) {
        missingIn.push(lang);
      }
    }
    if (missingIn.length > 0) {
      console.log(`   "${key}" missing in: ${missingIn.join(', ')}`);
      hasMissing = true;
    }
  }

  if (!hasMissing) {
    console.log('   ✅ No missing keys found');
  }
  console.log('');

  // Check for unused keys
  console.log('🗑️  UNUSED KEYS (keys defined but not used in code):\n');
  let hasUnused = false;
  for (const lang in allDefinedKeys) {
    const unused = [...allDefinedKeys[lang]].filter(key => !usedKeys.has(key));
    if (unused.length > 0) {
      console.log(`   ${lang.toUpperCase()}: ${unused.length} unused keys`);
      for (const key of unused) {
        console.log(`     - "${key}"`);
      }
      hasUnused = true;
    }
  }

  if (!hasUnused) {
    console.log('   ✅ No unused keys found');
  }
  console.log('');

  // Summary
  console.log('📊 SUMMARY:');
  console.log(`   Total keys defined: ${allKeys.size}`);
  console.log(`   Keys used in code: ${usedKeys.size}`);
  console.log(`   Missing keys: ${hasMissing ? 'YES ❌' : 'NO ✅'}`);
  console.log(`   Unused keys: ${hasUnused ? 'YES ❌' : 'NO ✅'}`);
  console.log('');

  if (hasMissing || hasUnused) {
    console.log('⚠️  Audit completed with issues found.');
    process.exit(1);
  } else {
    console.log('✅ Audit completed successfully.');
    process.exit(0);
  }
}

main();
