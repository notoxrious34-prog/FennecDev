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
    // ── Guard: input type and presence ─────────────────────────────────────
    if (!licenseToken || typeof licenseToken !== 'string') {
      logger.warn('licenseService.verifyLicense: received non-string input', {
        type: typeof licenseToken,
      });
      return {
        success: false,
        error: { code: 'INVALID_INPUT', message: 'License token must be a non-empty string' },
      };
    }

    const trimmed = licenseToken.trim();

    // ── Guard: length sanity check ──────────────────────────────────────────
    // Valid tokens: ~400–2000 chars (base64 of RSA-4096 signature + payload JSON)
    // Rejects: empty pastes, truncated tokens, injected payloads
    if (trimmed.length < 200 || trimmed.length > 5000) {
      logger.warn('licenseService.verifyLicense: token length outside valid range', {
        length: trimmed.length,
      });
      return {
        success: false,
        error: {
          code: 'INVALID_TOKEN_LENGTH',
          message: `Token length ${trimmed.length} is outside the valid range (200–5000 characters)`,
        },
      };
    }

    // ── Continue with verification logic ───────────────────────────────────
    try {
      // ── Step 1: Decode base64 token ─────────────────────────────────────
      let parsed;
      try {
        const decoded = Buffer.from(trimmed, 'base64').toString('utf8');
        parsed = JSON.parse(decoded);
      } catch (decodeError) {
        logger.warn('licenseService.verifyLicense: token decode/parse failed', {
          error: decodeError.message,
          // Do NOT log the token — it contains machineId
        });
        return {
          success: false,
          error: { code: 'INVALID_TOKEN_FORMAT', message: 'Token could not be decoded' },
        };
      }

      // ── Step 2: Validate structure ──────────────────────────────────────
      if (!parsed || typeof parsed !== 'object') {
        return {
          success: false,
          error: { code: 'INVALID_TOKEN_STRUCTURE', message: 'Token is not a valid object' },
        };
      }

      const { payload, signature } = parsed;

      if (!payload || typeof payload !== 'object') {
        return {
          success: false,
          error: { code: 'MISSING_PAYLOAD', message: 'Token payload is missing or invalid' },
        };
      }

      if (!signature || typeof signature !== 'string') {
        return {
          success: false,
          error: { code: 'MISSING_SIGNATURE', message: 'Token signature is missing or invalid' },
        };
      }

      // ── Step 3: Validate payload schema BEFORE crypto ──────────────────
      // Reject malformed payloads before spending CPU on RSA verification
      const schemaErrors = this._validatePayloadSchema(payload);
      if (schemaErrors.length > 0) {
        logger.warn('licenseService.verifyLicense: payload schema invalid', {
          errors: schemaErrors,
        });
        return {
          success: false,
          error: {
            code: 'MALFORMED_PAYLOAD',
            message: schemaErrors[0],
            details: schemaErrors,
          },
        };
      }

      // ── Step 4: Verify RSA-SHA256 signature ─────────────────────────────
      // Canonical key order MUST match issueLicense.js signing order
      const canonical = {
        machineId:   payload.machineId,
        issuedAt:    payload.issuedAt,
        expiresAt:   payload.expiresAt,
        licenseType: payload.licenseType,
      };

      let isSignatureValid;
      try {
        const verifier = crypto.createVerify('SHA256');
        verifier.update(JSON.stringify(canonical));
        isSignatureValid = verifier.verify(PUBLIC_KEY, signature, 'base64');
      } catch (cryptoError) {
        logger.error('licenseService.verifyLicense: crypto.createVerify threw', {
          error: cryptoError.message,
          code:  cryptoError.code,
        });
        return {
          success: false,
          error: { code: 'CRYPTO_ERROR', message: 'Signature verification failed unexpectedly' },
        };
      }

      if (!isSignatureValid) {
        logger.warn('licenseService.verifyLicense: signature invalid');
        return {
          success: false,
          error: { code: 'INVALID_SIGNATURE', message: 'License signature is not valid' },
        };
      }

      // ── Step 5: Check expiry ────────────────────────────────────────────
      const now = Date.now();
      if (payload.expiresAt < now) {
        logger.info('licenseService.verifyLicense: license expired', {
          expiresAt: new Date(payload.expiresAt).toISOString(),
          expiredMs: now - payload.expiresAt,
        });
        return {
          success: false,
          error: {
            code: 'LICENSE_EXPIRED',
            message: `License expired on ${new Date(payload.expiresAt).toLocaleDateString()}`,
          },
        };
      }

      // ── Step 6: Verify machine ID ───────────────────────────────────────
      let currentMachineId;
      try {
        currentMachineId = machineIdSync();
      } catch (machineIdError) {
        logger.error('licenseService.verifyLicense: machineIdSync threw', {
          error: machineIdError.message,
        });
        return {
          success: false,
          error: { code: 'MACHINE_ID_ERROR', message: 'Could not retrieve machine identifier' },
        };
      }

      if (payload.machineId.toLowerCase() !== currentMachineId.toLowerCase()) {
        logger.warn('licenseService.verifyLicense: machine ID mismatch');
        // Do NOT log either machine ID — privacy/security concern
        return {
          success: false,
          error: {
            code: 'MACHINE_MISMATCH',
            message: 'This license is registered to a different device',
          },
        };
      }

      // ── All checks passed ───────────────────────────────────────────────
      logger.info('licenseService.verifyLicense: verification successful', {
        licenseType: payload.licenseType,
        expiresAt:   new Date(payload.expiresAt).toISOString(),
        daysLeft:    Math.floor((payload.expiresAt - now) / (1000 * 60 * 60 * 24)),
      });

      return { success: true, data: payload };

    } catch (unexpectedError) {
      // Catch-all for anything not handled above
      logger.error('licenseService.verifyLicense: unexpected error', {
        error: unexpectedError.message,
        stack: unexpectedError.stack?.split('\n').slice(0, 3).join(' | '),
      });
      return {
        success: false,
        error: {
          code: 'VERIFICATION_ERROR',
          message: 'An unexpected error occurred during verification',
        },
      };
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
   * Checks if the currently stored license is valid.
   * Runs the full verification chain.
   * Used by the boot guard in main.js.
   *
   * @returns {{ valid: boolean, reason: string, details?: object }}
   */
  async isLicenseValid() {
    try {
      const token = this.loadStoredLicense();

      if (!token) {
        return { valid: false, reason: 'NO_LICENSE_FOUND' };
      }

      const result = this.verifyLicense(token);

      if (result.success) {
        return {
          valid:   true,
          reason:  'VALID',
          details: result.data,
        };
      }

      return {
        valid:  false,
        reason: result.error?.code || 'UNKNOWN',
      };
    } catch (err) {
      logger.error('licenseService.isLicenseValid: unexpected error', {
        error: err.message,
      });
      return { valid: false, reason: 'VERIFICATION_ERROR' };
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
   * Validates the payload object has correct field types and values.
   * Called BEFORE the RSA signature check to fail fast on obviously
   * invalid tokens without spending CPU on crypto.
   *
   * @param {object} payload - The decoded token payload
   * @returns {string[]} Array of error messages. Empty array = valid.
   */
  _validatePayloadSchema(payload) {
    const errors = [];
    const MACHINE_ID_REGEX = /^[a-f0-9]{64}$/i;
    const VALID_LICENSE_TYPES = ['trial', 'full'];

    // machineId
    if (!payload.machineId || typeof payload.machineId !== 'string') {
      errors.push('machineId is required and must be a string');
    } else if (!MACHINE_ID_REGEX.test(payload.machineId)) {
      errors.push(
        `machineId must be a 64-character hex string (received ${payload.machineId.length} chars)` 
      );
    }

    // issuedAt
    if (payload.issuedAt === undefined || payload.issuedAt === null) {
      errors.push('issuedAt is required');
    } else if (typeof payload.issuedAt !== 'number' || !Number.isFinite(payload.issuedAt)) {
      errors.push('issuedAt must be a finite number (Unix millisecond timestamp)');
    } else if (payload.issuedAt <= 0) {
      errors.push('issuedAt must be a positive number');
    } else if (payload.issuedAt > Date.now() + (24 * 60 * 60 * 1000)) {
      // Allow 24h clock skew but reject obviously future-dated issuance
      errors.push('issuedAt cannot be in the future');
    }

    // expiresAt
    if (payload.expiresAt === undefined || payload.expiresAt === null) {
      errors.push('expiresAt is required');
    } else if (typeof payload.expiresAt !== 'number' || !Number.isFinite(payload.expiresAt)) {
      errors.push('expiresAt must be a finite number (Unix millisecond timestamp)');
    } else if (payload.expiresAt <= 0) {
      errors.push('expiresAt must be a positive number');
    }

    // Logical relationship between timestamps
    if (
      typeof payload.issuedAt === 'number' &&
      typeof payload.expiresAt === 'number' &&
      payload.issuedAt >= payload.expiresAt
    ) {
      errors.push('expiresAt must be after issuedAt');
    }

    // licenseType
    if (!payload.licenseType || typeof payload.licenseType !== 'string') {
      errors.push('licenseType is required and must be a string');
    } else if (!VALID_LICENSE_TYPES.includes(payload.licenseType)) {
      errors.push(
        `licenseType must be one of: ${VALID_LICENSE_TYPES.join(', ')} (received: "${payload.licenseType}")` 
      );
    }

    return errors;
  }

  /**
   * Returns the decoded license details from the stored token.
   * Does NOT re-verify the signature — verification happens at activation time.
   * Returns null if no license is stored or if the stored token is unparseable.
   *
   * @returns {object|null} License details or null
   */
  getLicenseDetails() {
    try {
      const token = this.loadStoredLicense();
      if (!token || typeof token !== 'string' || token.trim().length === 0) {
        return null;
      }

      // Decode the base64 token
      let parsed;
      try {
        const decoded = Buffer.from(token.trim(), 'base64').toString('utf8');
        parsed = JSON.parse(decoded);
      } catch {
        logger.warn('licenseService.getLicenseDetails: stored token is unparseable');
        return null;
      }

      const { payload } = parsed;
      if (!payload || typeof payload !== 'object') return null;

      const now = Date.now();
      const msLeft = Math.max(0, payload.expiresAt - now);
      const daysLeft = Math.floor(msLeft / (1000 * 60 * 60 * 24));

      return {
        machineId:    payload.machineId   || null,
        licenseType:  payload.licenseType || null,    // 'trial' | 'full'
        issuedAt:     payload.issuedAt
                        ? new Date(payload.issuedAt).toISOString()
                        : null,
        expiresAt:    payload.expiresAt
                        ? new Date(payload.expiresAt).toISOString()
                        : null,
        isExpired:    payload.expiresAt < now,
        isTrial:      payload.licenseType === 'trial',
        daysLeft,
        // Computed display helpers for the UI
        isExpiringSoon: daysLeft > 0 && daysLeft <= 30,  // Warning threshold: 30 days
        isExpiringSoonCritical: daysLeft > 0 && daysLeft <= 7, // Critical: 7 days
      };
    } catch (err) {
      logger.error('licenseService.getLicenseDetails: unexpected error', {
        error: err.message,
      });
      return null;
    }
  }
}

module.exports = LicenseService;
