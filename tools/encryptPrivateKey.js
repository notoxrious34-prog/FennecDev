#!/usr/bin/env node
/**
 * Private Key Encryption Tool — Fennec Facturation
 *
 * Encrypts an RSA private key with AES-256-CBC using a passphrase.
 * Uses Node.js built-in crypto module.
 *
 * Usage:
 *   node tools/encryptPrivateKey.js fennec_license_private.pem
 *
 * Output:
 *   - fennec_license_private_encrypted.pem (AES-256 encrypted)
 *
 * Security:
 *   Use a strong passphrase (20+ characters, mixed types).
 *   Store the passphrase in a password manager.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  const keyPath = process.argv[2];
  if (!keyPath) {
    console.error('Usage: node tools/encryptPrivateKey.js <private-key-file>');
    process.exit(1);
  }

  if (!fs.existsSync(keyPath)) {
    console.error('❌ Private key file not found:', keyPath);
    process.exit(1);
  }

  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║   Private Key Encryption — Fennec Facturation   ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  const passphrase = await question('Enter passphrase (20+ characters recommended): ');
  const confirm = await question('Confirm passphrase: ');

  if (passphrase !== confirm) {
    console.error('❌ Passphrases do not match.');
    rl.close();
    process.exit(1);
  }

  if (passphrase.length < 20) {
    console.warn('⚠️  Warning: Passphrase is less than 20 characters. Consider using a stronger passphrase.');
    const proceed = await question('Continue anyway? (y/N): ');
    if (proceed.toLowerCase() !== 'y') {
      console.log('Cancelled.');
      rl.close();
      process.exit(0);
    }
  }

  const privateKey = fs.readFileSync(keyPath, 'utf8');

  // Generate a random salt and IV
  const salt = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);

  // Derive encryption key from passphrase using PBKDF2
  const key = crypto.pbkdf2Sync(passphrase, salt, 100000, 32, 'sha256');

  // Encrypt the private key using AES-256-CBC
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  // Combine salt, IV, authTag, and encrypted data
  const encryptedData = Buffer.concat([
    salt,
    iv,
    authTag,
    Buffer.from(encrypted, 'hex')
  ]);

  const outputPath = keyPath.replace('.pem', '_encrypted.pem');
  fs.writeFileSync(outputPath, encryptedData);

  console.log('\n✅ Private key encrypted successfully.');
  console.log(`   Encrypted file: ${outputPath}\n`);

  // Verify the encrypted key can be decrypted
  console.log('Verifying encryption...');
  try {
    const extractedSalt = encryptedData.slice(0, 32);
    const extractedIv = encryptedData.slice(32, 48);
    const extractedAuthTag = encryptedData.slice(48, 64);
    const extractedEncrypted = encryptedData.slice(64);

    const verifyKey = crypto.pbkdf2Sync(passphrase, extractedSalt, 100000, 32, 'sha256');
    const decipher = crypto.createDecipheriv('aes-256-cbc', verifyKey, extractedIv);
    decipher.setAuthTag(extractedAuthTag);

    let decrypted = decipher.update(extractedEncrypted, null, 'utf8');
    decrypted += decipher.final('utf8');

    // Verify it's a valid RSA key
    crypto.createPrivateKey(decrypted);

    console.log('✅ Encryption verification successful.\n');
  } catch (err) {
    console.error('❌ Encryption verification failed:', err.message);
    fs.unlinkSync(outputPath);
    process.exit(1);
  }

  console.log('⚠️  IMPORTANT SECURITY STEPS:\n');
  console.log('  1. Store this passphrase in a password manager (Bitwarden, 1Password, etc.)');
  console.log('  2. Backup the encrypted key to multiple secure locations:');
  console.log('     - Encrypted USB drive (primary)');
  console.log('     - Password manager secure notes (secondary)');
  console.log('     - Company-controlled encrypted cloud storage (tertiary)');
  console.log('  3. Delete the unencrypted private key:');
  console.log(`     rm "${keyPath}"\n`);

  rl.close();
}

main().catch(err => {
  console.error('Error:', err.message);
  rl.close();
  process.exit(1);
});
