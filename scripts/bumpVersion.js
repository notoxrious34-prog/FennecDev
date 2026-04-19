#!/usr/bin/env node
/**
 * Bump the application version across all files that contain it.
 *
 * Usage:
 *   node scripts/bumpVersion.js patch   # 3.0.0 → 3.0.1
 *   node scripts/bumpVersion.js minor   # 3.0.0 → 3.1.0
 *   node scripts/bumpVersion.js major   # 3.0.0 → 4.0.0
 *   node scripts/bumpVersion.js 3.1.2   # Set specific version
 */

const fs   = require('fs');
const path = require('path');

const ROOT       = path.join(__dirname, '..');
const pkgPath    = path.join(ROOT, 'package.json');
const pkg        = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const currentVer = pkg.version;

const [major, minor, patch] = currentVer.split('.').map(Number);
const bumpType = process.argv[2];

let newVersion;
if (bumpType === 'patch') newVersion = `${major}.${minor}.${patch + 1}`;
else if (bumpType === 'minor') newVersion = `${major}.${minor + 1}.0`;
else if (bumpType === 'major') newVersion = `${major + 1}.0.0`;
else if (/^\d+\.\d+\.\d+$/.test(bumpType)) newVersion = bumpType;
else {
  console.error('Usage: node scripts/bumpVersion.js [patch|minor|major|X.Y.Z]');
  process.exit(1);
}

console.log(`Bumping version: ${currentVer} → ${newVersion}`);

// Update package.json
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log('  ✅ package.json');

// Update CHANGELOG.md — add [Unreleased] section heading for the new version
const changelogPath = path.join(ROOT, 'CHANGELOG.md');
if (fs.existsSync(changelogPath)) {
  let changelog = fs.readFileSync(changelogPath, 'utf8');
  const today = new Date().toISOString().split('T')[0];
  changelog = changelog.replace(
    /## \[Unreleased\]/,
    `## [${newVersion}] — ${today}\n\n### Added\n- (Document changes here)\n\n## [Unreleased]`
  );
  fs.writeFileSync(changelogPath, changelog);
  console.log('  ✅ CHANGELOG.md (added version section)');
}

console.log(`\nVersion bumped to ${newVersion}.`);
console.log('Next steps:');
console.log('  1. Fill in the changes in CHANGELOG.md');
console.log('  2. git add package.json CHANGELOG.md');
console.log(`  3. git commit -m "chore: bump version to ${newVersion}"`);
console.log(`  4. git tag v${newVersion}`);
console.log('  5. npm run dist');
