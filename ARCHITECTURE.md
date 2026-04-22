# Architecture Decisions Record (ADR)

This document records important architectural decisions made throughout the development of Fennec Facturation. Each decision follows the standard ADR format.

---

## licenseService — Test Architecture Decisions

### ADR-001: RSA Key Injection via Constructor Parameter
**Date:** Sprint v3.1.0
**Status:** Accepted

**Context:**
- Unit tests for `licenseService.js` needed to test RSA-SHA256 signature verification
- Hardcoding PEM keys in test files caused token overflow and security concerns
- The service used a hardcoded `PUBLIC_KEY` constant from production code

**Decision:**
`licenseService` accepts optional `publicKey` and `machineId` parameters via constructor:

```javascript
class LicenseService {
  constructor(licenseFilePath = null, publicKey = null, machineId = null) {
    this.licenseFilePath = licenseFilePath || path.join(app.getPath('userData'), 'license.lic');
    this.publicKey = publicKey || PUBLIC_KEY;
    this.machineId = machineId;
    // ...
  }
}
```

**Consequences:**
- ✅ Tests can inject dynamically generated RSA keys for isolation
- ✅ Tests can inject mock machineId to avoid dependency on `node-machine-id`
- ✅ Production code remains unchanged (defaults to hardcoded values)
- ⚠️ Constructor signature slightly more complex

**Usage Pattern:**
```javascript
const service = new LicenseService(
  '/tmp/test-license',
  TEST_KEYS.publicKey,
  MOCK_MACHINE_ID
);
```

---

### ADR-002: vi.doMock + Dynamic Import (not vi.mock)
**Date:** Sprint v3.1.0
**Status:** Accepted

**Context:**
- Tests needed to mock `electron/security/publicKey.js` to avoid production key dependency
- Initial attempt used `vi.mock()` which is hoisted at module load time
- `generateKeyPairSync()` was called AFTER the mock was applied, resulting in empty string keys

**Decision:**
Use `vi.doMock()` with dynamic import pattern:

```javascript
// 1. Generate keys FIRST
const TEST_KEYS = crypto.generateKeyPairSync('rsa', { /* ... */ });

// 2. Mock SECOND
vi.doMock('../../electron/security/publicKey.js', () => ({
  PUBLIC_KEY: TEST_KEYS.publicKey.export({ type: 'spki', format: 'pem' })
}));

// 3. Dynamic import THIRD
const { LicenseService } = await import('../../electron/services/licenseService.js');
```

**Consequences:**
- ✅ Keys are generated before mock is applied
- ✅ Mock receives actual key material
- ✅ All signature verification tests pass
- ⚠️ Requires dynamic import (async test pattern)

---

### ADR-003: machineId Format — 64 hex characters
**Date:** Sprint v3.1.0
**Status:** Accepted

**Context:**
- `licenseService` validates machineId format using regex: `/^[a-f0-9]{64}$/`
- Initial test used 76-character string, causing `MALFORMED_PAYLOAD` error
- Required format matches SHA-256 hash length (256 bits = 64 hex chars)

**Decision:**
Valid machineId must be exactly 64 hexadecimal characters.

**Test Values:**
- ✅ Valid: `'feedbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'` (64 chars)
- ❌ Invalid: `'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefabcd'` (68 chars)
- ❌ Invalid: `'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'` (same as MOCK_MACHINE_ID)

**Consequences:**
- ✅ Strict validation prevents malformed payloads
- ✅ Aligns with SHA-256 hash output format
- ⚠️ Tests must use exactly 64 hex chars

---

### ADR-004: machine ID comparison is case-insensitive
**Date:** Sprint v3.1.0
**Status:** Accepted

**Context:**
- Test confirmed that machine ID comparison is case-insensitive
- Implementation uses `toLowerCase()` on both sides:
  ```javascript
  const match = payload.machineId.toLowerCase() === currentMachineId.toLowerCase()
  ```

**Decision:**
Machine ID comparison is case-insensitive.

**Implications:**
- ✅ Accepts both uppercase and lowercase hex characters
- ✅ Tolerant of OS API differences (Windows/macOS/Linux may return different case)
- ⚠️ If machineId is always SHA-256 hash (always lowercase), `toLowerCase()` is defensive but not strictly necessary

**Open Question:**
Does `getMachineId()` return a hex hash (always lowercase) or a raw OS string (case varies)?
- If hash → `toLowerCase()` is defensive overhead
- If OS string → `toLowerCase()` is essential for cross-platform compatibility

**Test Coverage:**
- ✅ Confirmed by test: `machine ID comparison is case-insensitive`
