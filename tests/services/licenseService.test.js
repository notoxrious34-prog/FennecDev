// tests/services/licenseService.test.js
// Unit Tests — licenseService.js verifyLicense() (RSA-SHA256)
// Keys generated at module level to avoid vi.mock hoisting issues

import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import crypto from 'crypto';

// Generate test keys at module level (before vi.mock)
const TEST_KEYS = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

// Mock electron - MUST be at top before any imports
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn((name) => {
      const paths = {
        userData: '/tmp/fennec-test-userdata',
        appData: '/tmp/fennec-test-appdata',
      };
      return paths[name] ?? `/tmp/fennec-test-${name}`;
    }),
    isPackaged: false,
  },
}));

// Mock machineId - must be 64-character hex string as per licenseService.js schema
const MOCK_MACHINE_ID = 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';

vi.mock('node-machine-id', () => ({
  machineIdSync: vi.fn(() => MOCK_MACHINE_ID),
}));

// Mock logger
const mockApp = {
  getPath: vi.fn((name) => {
    const paths = {
      userData: '/tmp/fennec-test-userdata',
      appData: '/tmp/fennec-test-appdata',
    };
    return paths[name] ?? `/tmp/fennec-test-${name}`;
  }),
  isPackaged: false,
};

vi.mock('../../electron/utils/logger.js', () => ({
  init: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  _app: mockApp,
}));

// Mock publicKey with getter to access the module-level key
vi.mock('../../electron/security/publicKey.js', () => ({
  PUBLIC_KEY: TEST_KEYS.publicKey,
}));

// Token factory
const MS_PER_DAY = 86_400_000;

function buildToken(overrides = {}, signingKey = null) {
  const now = Date.now();
  const defaultIssuedAt = now - MS_PER_DAY;
  const defaultExpiresAt = now + 365 * MS_PER_DAY;

  const payload = {
    machineId: MOCK_MACHINE_ID,
    issuedAt: defaultIssuedAt,
    expiresAt: defaultExpiresAt,
    licenseType: 'full',
    ...overrides,
  };

  const tokenObj = {
    payload,
    signature: null,
  };

  const keyToUse = signingKey ?? TEST_KEYS.privateKey;
  const canonical = {
    machineId: payload.machineId,
    issuedAt: payload.issuedAt,
    expiresAt: payload.expiresAt,
    licenseType: payload.licenseType,
  };

  const signature = crypto
    .sign('sha256', Buffer.from(JSON.stringify(canonical)), keyToUse)
    .toString('base64');

  tokenObj.signature = signature;
  return Buffer.from(JSON.stringify(tokenObj)).toString('base64');
}

// Test suite for verifyLicense() only
describe('licenseService.verifyLicense()', () => {
  let LicenseService;

  beforeAll(async () => {
    LicenseService = (await import('../../electron/services/licenseService.js')).default;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ════════════════════════════════════════════════════════════════
  // SUITE 1 — Input Validation (Original 3 tests)
  // ════════════════════════════════════════════════════════════════
  it('returns error for null input', () => {
    const result = new LicenseService('/tmp/test-license', TEST_KEYS.publicKey, MOCK_MACHINE_ID).verifyLicense(null);
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('INVALID_INPUT');
  });

  it('returns error for invalid machineId format', () => {
    const token = buildToken({ machineId: 'invalid-id' });
    const result = new LicenseService('/tmp/test-license', TEST_KEYS.publicKey, MOCK_MACHINE_ID).verifyLicense(token);
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('MALFORMED_PAYLOAD');
  });

  it('returns error for invalid licenseType', () => {
    const token = buildToken({ licenseType: 'invalid-type' });
    const result = new LicenseService('/tmp/test-license', TEST_KEYS.publicKey, MOCK_MACHINE_ID).verifyLicense(token);
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('MALFORMED_PAYLOAD');
  });

  it('returns success for valid signed token', () => {
    const token = buildToken({ licenseType: 'full' });
    const result = new LicenseService('/tmp/test-license', TEST_KEYS.publicKey, MOCK_MACHINE_ID).verifyLicense(token);
    expect(result.success).toBe(true);
  });

  // ════════════════════════════════════════════════════════════════
  // SUITE 2 — RSA Signature Verification
  // ════════════════════════════════════════════════════════════════
  it('returns success for signed trial license', () => {
    const token = buildToken({
      licenseType: 'trial',
      expiresAt: Date.now() + 60 * MS_PER_DAY,
    });
    const result = new LicenseService('/tmp/test-license', TEST_KEYS.publicKey, MOCK_MACHINE_ID).verifyLicense(token);
    expect(result.success).toBe(true);
    expect(result.data.licenseType).toBe('trial');
  });

  // ════════════════════════════════════════════════════════════════
  // SUITE 3 — Expiry Logic
  // ════════════════════════════════════════════════════════════════
  it('returns error for expired token', () => {
    const now = Date.now();
    const token = buildToken({
      issuedAt: now - 2 * MS_PER_DAY,
      expiresAt: now - MS_PER_DAY,
    });
    const result = new LicenseService('/tmp/test-license', TEST_KEYS.publicKey, MOCK_MACHINE_ID).verifyLicense(token);
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('LICENSE_EXPIRED');
  });

  it('returns success for token expiring in future', () => {
    const now = Date.now();
    const token = buildToken({
      issuedAt: now - MS_PER_DAY,
      expiresAt: now + MS_PER_DAY,
    });
    const result = new LicenseService('/tmp/test-license', TEST_KEYS.publicKey, MOCK_MACHINE_ID).verifyLicense(token);
    expect(result.success).toBe(true);
  });

  // ════════════════════════════════════════════════════════════════
  // SUITE 4 — Machine ID Enforcement
  // ════════════════════════════════════════════════════════════════
  it('returns error for machine mismatch', () => {
    const now = Date.now();
    // Build token with different valid machineId (64 chars)
    const differentMachineId = 'feedbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
    const token = buildToken({
      issuedAt: now - MS_PER_DAY,
      expiresAt: now + 365 * MS_PER_DAY,
      machineId: differentMachineId,
    });
    
    // Verify with MOCK_MACHINE_ID (different from token's machineId)
    const result = new LicenseService('/tmp/test-license', TEST_KEYS.publicKey, MOCK_MACHINE_ID).verifyLicense(token);
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('MACHINE_MISMATCH');
  });

  it('machine ID comparison is case-insensitive', () => {
    const now = Date.now();
    const token = buildToken({
      issuedAt: now - MS_PER_DAY,
      expiresAt: now + 365 * MS_PER_DAY,
      machineId: MOCK_MACHINE_ID.toUpperCase(),
    });
    const result = new LicenseService('/tmp/test-license', TEST_KEYS.publicKey, MOCK_MACHINE_ID.toUpperCase()).verifyLicense(token);
    expect(result.success).toBe(true);
  });
});
