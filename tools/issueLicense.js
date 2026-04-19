#!/usr/bin/env node
/**
 * License Issuance CLI Tool — Fennec Facturation
 *
 * Generates and signs a license token for a customer machine.
 * Usage: node tools/issueLicense.js <machine-id> [options]
 *
 * Options:
 *   --type <trial|full>    License type (default: full)
 *   --days <number>       Validity period in days (default: 365)
 *   --output <file>       Output license file path (default: fennec-facturation.license)
 *
 * Examples:
 *   node tools/issueLicense.js cd9f101a2e1d325ecaf423f039e401c236670e3c41b1cfdc3b9550e4d5c46b85
 *   node tools/issueLicense.js <machine-id> --type trial --days 30
 *   node tools/issueLicense.js <machine-id> --output customer-name.license
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const machineId = args[0];

if (!machineId) {
  console.error('❌ Missing required argument: machine-id');
  console.error('\nUsage: node tools/issueLicense.js <machine-id> [options]');
  console.error('\nOptions:');
  console.error('  --type <trial|full>    License type (default: full)');
  console.error('  --days <number>       Validity period in days (default: 365)');
  console.error('  --output <file>       Output license file path (default: fennec-facturation.license)');
  console.error('\nExamples:');
  console.error('  node tools/issueLicense.js cd9f101a2e1d325ecaf423f039e401c236670e3c41b1cfdc3b9550e4d5c46b85');
  console.error('  node tools/issueLicense.js <machine-id> --type trial --days 30');
  process.exit(1);
}

// Parse options
const options = {
  type: 'full',
  days: 365,
  output: 'fennec-facturation.license'
};

for (let i = 1; i < args.length; i++) {
  if (args[i] === '--type' && args[i + 1]) {
    options.type = args[i + 1];
    i++;
  } else if (args[i] === '--days' && args[i + 1]) {
    options.days = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--output' && args[i + 1]) {
    options.output = args[i + 1];
    i++;
  }
}

// Validate options
if (options.type !== 'trial' && options.type !== 'full') {
  console.error('❌ Invalid license type:', options.type);
  console.error('   Must be "trial" or "full"');
  process.exit(1);
}

if (isNaN(options.days) || options.days <= 0) {
  console.error('❌ Invalid days:', options.days);
  console.error('   Must be a positive number');
  process.exit(1);
}

// Load the private key
const privateKeyPath = path.join(__dirname, '../fennec_license_private.pem');
if (!fs.existsSync(privateKeyPath)) {
  console.error('❌ Private key not found:', privateKeyPath);
  console.error('   Run: node tools/generateKeyPair.js');
  process.exit(1);
}

const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

// Create license payload
const now = Date.now();
const payload = {
  machineId: machineId,
  issuedAt: now,
  expiresAt: now + (options.days * 24 * 60 * 60 * 1000),
  licenseType: options.type
};

// Sign the payload
const payloadString = JSON.stringify(payload);
const sign = crypto.createSign('SHA256');
sign.update(payloadString);
sign.end();
const signature = sign.sign(privateKey, 'base64');

// Combine payload and signature into a token
const token = {
  payload: payload,
  signature: signature
};

const tokenString = JSON.stringify(token);

// Save to license file
fs.writeFileSync(options.output, tokenString, 'utf8');

console.log('╔═══════════════════════════════════════════════════╗');
console.log('║   License Issued — Fennec Facturation            ║');
console.log('╚═══════════════════════════════════════════════════╝');
console.log('');
console.log('  Machine ID:', machineId);
console.log('  License Type:', options.type.toUpperCase());
console.log('  Valid For:', options.days, 'days');
console.log('  Issued:', new Date(payload.issuedAt).toISOString());
console.log('  Expires:', new Date(payload.expiresAt).toISOString());
console.log('  License File:', options.output);
console.log('');
console.log('✅ License token signed and saved successfully.');
console.log('');
console.log('To activate:');
console.log('  1. Send the license file to the customer');
console.log('  2. Instruct the customer to place it in:');
console.log('     Windows: %APPDATA%\\Fennec Facturation\\');
console.log('     macOS: ~/Library/Application Support/Fennec Facturation/');
console.log('     Linux: ~/.config/Fennec Facturation/');
console.log('  3. The customer should restart the application');
