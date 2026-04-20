#!/usr/bin/env node
/**
 * License Token Signing Tool — Fennec Facturation
 *
 * Signs a license payload with the RSA private key.
 * Usage: node tools/signLicense.js <machine-id>
 *
 * The signed token can be saved to a .license file for activation.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const machineId = process.argv[2];

if (!machineId) {
  console.error('Usage: node tools/signLicense.js <machine-id>');
  console.error('Example: node tools/signLicense.js cd9f101a2e1d325ecaf423f039e401c236670e3c41b1cfdc3b9550e4d5c46b85');
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

// Create license payload with canonical key order (must match verifier)
const payload = {
  machineId:   machineId,
  issuedAt:    Date.now(),
  expiresAt:   Date.now() + (365 * 24 * 60 * 60 * 1000),
  licenseType: 'full'
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

// Encode the token as base64 to match application verifier protocol
const tokenString = Buffer.from(JSON.stringify(token), 'utf8').toString('base64');

// Save to .license file
const licensePath = path.join(__dirname, '../fennec-facturation.license');
fs.writeFileSync(licensePath, tokenString, 'utf8');

console.log('✅ License token signed and saved');
console.log('   Machine ID:', machineId);
console.log('   License Type:', payload.licenseType);
console.log('   Expires:', new Date(payload.expiresAt).toISOString());
console.log('   License file:', licensePath);
console.log('\nTo activate:');
console.log('   1. Copy fennec-facturation.license to the application data directory');
console.log('   2. Restart the application');
