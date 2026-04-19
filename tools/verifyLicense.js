#!/usr/bin/env node
/**
 * License Token Verification Tool — Fennec Facturation
 *
 * Verifies a license token signature using the public key.
 * Usage: node tools/verifyLicense.js <license-file>
 *
 * This simulates what the application does at startup.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const licenseFile = process.argv[2] || 'fennec-facturation.license';

if (!fs.existsSync(licenseFile)) {
  console.error('❌ License file not found:', licenseFile);
  process.exit(1);
}

// Load the public key
const publicKeyPath = path.join(__dirname, '../electron/security/publicKey.js');
const publicKeyModule = require(publicKeyPath);
const publicKey = publicKeyModule.PUBLIC_KEY;

// Load the license token
const tokenString = fs.readFileSync(licenseFile, 'utf8');
const token = JSON.parse(tokenString);

const payload = token.payload;
const signature = token.signature;

// Verify the signature
const payloadString = JSON.stringify(payload);
const verify = crypto.createVerify('SHA256');
verify.update(payloadString);
verify.end();

const isValid = verify.verify(publicKey, signature, 'base64');

if (!isValid) {
  console.error('❌ License signature is INVALID');
  process.exit(1);
}

// Check expiration
const now = Date.now();
const expiresAt = payload.expiresAt;

if (now > expiresAt) {
  console.error('❌ License has expired');
  console.error('   Expired:', new Date(expiresAt).toISOString());
  process.exit(1);
}

// Check machine ID match
const currentMachineId = require('node-machine-id').machineIdSync();
if (payload.machineId !== currentMachineId) {
  console.error('❌ License machine ID mismatch');
  console.error('   License machine ID:', payload.machineId);
  console.error('   Current machine ID:', currentMachineId);
  process.exit(1);
}

console.log('✅ License is valid');
console.log('   Machine ID:', payload.machineId);
console.log('   License Type:', payload.licenseType);
console.log('   Issued:', new Date(payload.issuedAt).toISOString());
console.log('   Expires:', new Date(expiresAt).toISOString());
console.log('   Time remaining:', Math.floor((expiresAt - now) / (1000 * 60 * 60 * 24)), 'days');
