#!/usr/bin/env node
/**
 * Public Key Verification Script — Fennec Facturation
 *
 * Verifies that the embedded public key is a valid RSA key.
 * Usage: node scripts/verifyPublicKey.js
 */

const crypto = require('crypto');
const fs = require('fs');

let PUBLIC_KEY;

try {
  // Try the security module first
  PUBLIC_KEY = require('./electron/security/publicKey').PUBLIC_KEY;
} catch (err) {
  console.error('❌ Failed to load public key from electron/security/publicKey.js:', err.message);
  process.exit(1);
}

try {
  const keyObject = crypto.createPublicKey(PUBLIC_KEY);
  const keyDetails = keyObject.asymmetricKeyDetails;
  console.log('✅ Public key is valid');
  console.log('   Type:', keyObject.asymmetricKeyType);
  console.log('   Size:', keyDetails?.modulusLength, 'bits');
} catch (err) {
  console.error('❌ Public key is INVALID:', err.message);
  console.error('   Check the key was copied completely and without modification');
  process.exit(1);
}
