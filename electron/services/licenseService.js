const crypto = require('crypto');
const { machineIdSync } = require('node-machine-id');
const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const { PUBLIC_KEY } = require('../security/publicKey');
const logger = require('../utils/logger');

/**
 * LicenseService - RSA-SHA256 based license verification
 * Cryptographically sound, tamper-resistant license system
 */
class LicenseService {
  constructor() {
    this.licenseFilePath = path.join(app.getPath('userData'), '.license');
  }

  /**
   * Verify a license token using RSA-SHA256 signature verification
   */
  verifyLicense(licenseToken) {
    try {
      // Base64-decode the license token
      const decoded = Buffer.from(licenseToken, 'base64').toString('utf-8');
      const { payload, signature } = JSON.parse(decoded);

      if (!payload || !signature) {
        return { success: false, error: 'INVALID_TOKEN_FORMAT' };
      }

      // Verify RSA-SHA256 signature
      const verifier = crypto.createVerify('SHA256');
      verifier.update(JSON.stringify(payload));
      verifier.end();

      const isValid = verifier.verify(PUBLIC_KEY, signature, 'base64');

      if (!isValid) {
        return { success: false, error: 'INVALID_SIGNATURE' };
      }

      // Check expiration
      if (payload.expiresAt) {
        const expiryDate = new Date(payload.expiresAt);
        if (new Date() > expiryDate) {
          return { success: false, error: 'LICENSE_EXPIRED' };
        }
      }

      // Verify machine ID match
      const currentMachineId = machineIdSync();
      if (payload.machineId && payload.machineId !== currentMachineId) {
        return { success: false, error: 'MACHINE_MISMATCH' };
      }

      return { success: true, license: payload };
    } catch (error) {
      logger.error('License verification failed', error);
      return { success: false, error: 'VERIFICATION_ERROR' };
    }
  }

  /**
   * Get the current machine ID
   */
  async getMachineId() {
    try {
      return { success: true, machineId: machineIdSync() };
    } catch (error) {
      logger.error('Failed to get machine ID', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if the stored license is valid
   */
  async isLicenseValid() {
    try {
      const storedToken = this.loadStoredLicense();
      if (!storedToken) {
        return { valid: false, reason: 'NO_LICENSE_FOUND' };
      }

      const result = this.verifyLicense(storedToken);
      return { valid: result.success, reason: result.error || 'VALID' };
    } catch (error) {
      logger.error('License validity check failed', error);
      return { valid: false, reason: 'CHECK_ERROR' };
    }
  }

  /**
   * Store a license token to disk
   */
  storeLicense(licenseToken) {
    try {
      fs.writeFileSync(this.licenseFilePath, licenseToken, 'utf-8');
      logger.info('License stored successfully');
      return { success: true };
    } catch (error) {
      logger.error('Failed to store license', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load stored license from disk
   */
  loadStoredLicense() {
    try {
      if (fs.existsSync(this.licenseFilePath)) {
        return fs.readFileSync(this.licenseFilePath, 'utf-8');
      }
      return null;
    } catch (error) {
      logger.error('Failed to load license', error);
      return null;
    }
  }

  /**
   * Get license details
   */
  getLicenseDetails() {
    try {
      const storedToken = this.loadStoredLicense();
      if (!storedToken) {
        return { success: false, license: null };
      }

      const result = this.verifyLicense(storedToken);
      return result;
    } catch (error) {
      logger.error('Failed to get license details', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = LicenseService;
