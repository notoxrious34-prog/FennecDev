#!/usr/bin/env node
/**
 * RSA Key Pair Generator — Fennec Facturation License System
 *
 * Generates a 4096-bit RSA key pair for license signing and verification.
 * Uses Node.js built-in crypto module (no OpenSSL dependency).
 *
 * Usage:
 *   node tools/generateKeyPair.js
 *
 * Output:
 *   - fennec_license_private.pem (unencrypted private key)
 *   - fennec_license_public.pem (public key)
 *
 * Security:
 *   Run this on a secure machine.
 *   Encrypt the private key immediately after generation.
 *   Never commit the private key to version control.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('\n╔═══════════════════════════════════════════════════╗');
console.log('║   RSA Key Pair Generator — Fennec Facturation   ║');
console.log('╚═══════════════════════════════════════════════════╝\n');

// ── Generate Key Pair ─────────────────────────────────────────────────────────

console.log('Generating 4096-bit RSA key pair...');
console.log('This may take 10-30 seconds...\n');

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 4096,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

console.log('✅ Key pair generated successfully.\n');

// ── Save Keys ───────────────────────────────────────────────────────────────

const privatePath = path.join(__dirname, '..', 'fennec_license_private.pem');
const publicPath = path.join(__dirname, '..', 'fennec_license_public.pem');

fs.writeFileSync(privatePath, privateKey);
fs.writeFileSync(publicPath, publicKey);

console.log('Keys saved:');
console.log(`  Private: ${privatePath}`);
console.log(`  Public:  ${publicPath}\n`);

// ── Verify Keys ─────────────────────────────────────────────────────────────

try {
  const privateKeyObj = crypto.createPrivateKey(privateKey);
  const publicKeyObj = crypto.createPublicKey(publicKey);
  
  const privateDetails = privateKeyObj.asymmetricKeyDetails;
  const publicDetails = publicKeyObj.asymmetricKeyDetails;
  
  console.log('✅ Key verification:');
  console.log(`  Type: ${publicKeyObj.asymmetricKeyType}`);
  console.log(`  Size: ${publicDetails?.modulusLength} bits`);
  console.log(`  Private key format: PKCS#8`);
  console.log(`  Public key format: SPKI\n`);
} catch (err) {
  console.error('❌ Key verification failed:', err.message);
  process.exit(1);
}

// ── Display Public Key ───────────────────────────────────────────────────────

console.log('═══════════════════════════════════════════════════');
console.log('PUBLIC KEY (copy this into the application):');
console.log('═══════════════════════════════════════════════════\n');
console.log(publicKey);
console.log('═══════════════════════════════════════════════════\n');

// ── Security Warning ─────────────────────────────────────────────────────────

console.log('⚠️  SECURITY WARNING:\n');
console.log('  1. The private key is currently UNENCRYPTED.');
console.log('  2. Encrypt it immediately with a strong passphrase.');
console.log('  3. Store the encrypted key in multiple secure locations.');
console.log('  4. NEVER commit the private key to git.');
console.log('  5. Delete the unencrypted key after encrypting.\n');

console.log('To encrypt the private key, run:');
console.log('  node tools/encryptPrivateKey.js fennec_license_private.pem\n');

console.log('✅ Key generation complete.\n');
