# License Protocol Specification — Fennec Facturation
# Version: Derived from forensic audit of v3.0.1 source
# Status: AUTHORITATIVE — All tools must conform to this spec

## Token Wire Format

The license token is transmitted and stored as a **base64-encoded JSON string**.

**Wire format (as transmitted/stored):**
```
eyJwYXlsb2FkIjp7Im1hY2hpbmVJZCI6ImNkOWYxMDFhMmUxZDMyNWVjYWY0MjNmMDM...
```

**Decoded JSON structure (after base64 decode):**
```json
{
  "payload": {
    "machineId": "cd9f101a2e1d325ecaf423f039e401c236670e3c41b1cfdc3b9550e4d5c46b85",
    "issuedAt": 1713578470000,
    "expiresAt": 1721254470000,
    "licenseType": "full"
  },
  "signature": "MIICZgIBAAKBgQD/..."
}
```

**Encoding sequence:**
1. Construct payload object with canonical key order
2. Sign the JSON stringified payload
3. Combine into `{ payload, signature }` object
4. JSON.stringify the combined object
5. Base64-encode the JSON string (this is the final token)

## Payload Schema

```javascript
{
  "machineId":   string,  // 64-character lowercase hex string (from node-machine-id)
  "issuedAt":    number,  // Unix timestamp in MILLISECONDS
  "expiresAt":   number,  // Unix timestamp in MILLISECONDS
  "licenseType": string   // "trial" | "full"
}
```

**Field constraints:**
- `machineId`: Must be exactly 64 hex characters, case-insensitive (but stored lowercase)
- `issuedAt`: Must be positive integer, less than `expiresAt`
- `expiresAt`: Must be positive integer, greater than `issuedAt`
- `licenseType`: Must be exactly "trial" or "full"

## Canonical JSON Key Order

**CRITICAL:** The signer MUST use a specific key order when constructing the payload.

**Canonical order (enforced in signer):**
```javascript
const payload = {
  machineId:   machineId,
  issuedAt:    now,
  expiresAt:   now + (durationDays * 24 * 60 * 60 * 1000),
  licenseType: licenseType,
};
```

**Verifier behavior:** The verifier uses `JSON.stringify(payload)` directly on the parsed payload, so it will verify whatever key order the signer used. The signer must therefore use a consistent key order.

**Why this matters:** While the verifier uses the payload as-is, the signer should still use a consistent key order to ensure reproducibility and avoid issues if the verifier logic changes in the future.

## Signing Protocol

**Algorithm:** RSA-SHA256 (PKCS#1 v1.5)

**Input to signer:**
```javascript
const payloadString = JSON.stringify(canonicalPayload);
// Example: '{"machineId":"cd9f...","issuedAt":1713578470000,"expiresAt":1721254470000,"licenseType":"full"}'
```

**Node.js signing code:**
```javascript
const signer = crypto.createSign('SHA256');
signer.update(payloadString);
signer.end();
const signature = signer.sign(privateKey, 'base64');
```

**Output format:** Base64 string

## Verification Protocol

**Algorithm:** RSA-SHA256 (PKCS#1 v1.5)

**Input to verifier:**
```javascript
// Step 1: Base64-decode the token
const decoded = Buffer.from(tokenString, 'base64').toString('utf-8');
const { payload, signature } = JSON.parse(decoded);

// Step 2: Reconstruct canonical payload with IDENTICAL key order
const canonical = {
  machineId:   payload.machineId,
  issuedAt:    payload.issuedAt,
  expiresAt:   payload.expiresAt,
  licenseType: payload.licenseType,
};

// Step 3: Verify signature
const verifier = crypto.createVerify('SHA256');
verifier.update(JSON.stringify(canonical));
verifier.end();
const isValid = verifier.verify(PUBLIC_KEY, signature, 'base64');
```

**Signature format expected:** Base64 string

## Key Format

**Private key format:** PKCS#8 PEM
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQ...
-----END PRIVATE KEY-----
```

**Public key format:** SPKI PEM (SubjectPublicKeyInfo)
```
-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAqkcgpnYnJvGR7aWGJ5x3...
-----END PUBLIC KEY-----
```

**Key size:** 4096-bit RSA

**Public key location in app:** `electron/security/publicKey.js` (exported as `PUBLIC_KEY`)

## Machine ID

**Source:** `machineIdSync()` from `node-machine-id` package

**Format:** 64-character lowercase hex string

**Validation regex:** `/^[a-f0-9]{64}$/i`

**Example:** `cd9f101a2e1d325ecaf423f039e401c236670e3c41b1cfdc3b9550e4d5c46b85`

**Case handling:** The machine ID should be normalized to lowercase before signing and verification.

## Error Codes (from licenseService.js)

| Error Code | Description | Trigger Condition |
|------------|-------------|-------------------|
| `INVALID_TOKEN_FORMAT` | Token missing payload or signature | Parsed token lacks required fields |
| `INVALID_SIGNATURE` | RSA signature verification failed | Signature does not match payload with public key |
| `LICENSE_EXPIRED` | License expiration date has passed | `payload.expiresAt < Date.now()` |
| `MACHINE_MISMATCH` | Machine ID does not match current machine | `payload.machineId !== machineIdSync()` |
| `VERIFICATION_ERROR` | Unexpected error during verification | Catch-all for runtime errors (crypto failures, parse errors) |
| `NO_LICENSE_FOUND` | No license file exists on disk | `.license` file not found in userData |
| `CHECK_ERROR` | License validity check failed | Runtime error during validity check |

## Verification Sequence (licenseService.js)

1. **Load token** from `userData/.license` file
2. **Base64-decode** the token string
3. **Parse JSON** to extract `{ payload, signature }`
4. **Validate structure** — ensure both payload and signature exist
5. **Verify signature** using RSA-SHA256 with canonical key order
6. **Check expiration** — ensure `expiresAt > Date.now()`
7. **Verify machine ID** — ensure `payload.machineId === machineIdSync()`
8. **Return success** with payload data if all checks pass

## File Locations

**App (Production):**
- License file: `%APPDATA%\Fennec Facturation\.license`
- Public key: Inside ASAR bundle at `electron/security/publicKey.js`

**Development:**
- License tools: `tools/issueLicense.js`, `tools/verifyLicense.js`, `tools/signLicense.js`
- Private key: `fennec_license_private.pem` (NOT in git, must be secured)
- Public key: `electron/security/publicKey.js`

## Security Notes

1. **Never commit private key** to repository
2. **Private key encryption:** Encrypt with AES-256 before production deployment
3. **Token storage:** Tokens are stored as base64 strings, not raw JSON
4. **Signature verification:** Always verify signature before trusting any payload data
5. **Machine ID binding:** Licenses are bound to specific hardware — re-issuance required for hardware changes
6. **Timestamp validation:** Both `issuedAt` and `expiresAt` must be valid millisecond timestamps

---

## Root Cause Analysis — VERIFICATION_ERROR

**Issue:** Tokens generated by `tools/issueLicense.js` and `tools/signLicense.js` fail verification in the running application (licenseService.js).

**Root Cause:** TWO issues identified:

### Issue 1: Token Format Mismatch
The application verifier expects base64-encoded JSON tokens, but the local tools were outputting raw JSON.

**Evidence:**
1. **Application verifier (licenseService.js, line 24):**
   ```javascript
   const decoded = Buffer.from(licenseToken, 'base64').toString('utf-8');
   ```
   The app expects the token to be **base64-encoded JSON**.

2. **Local signer (issueLicense.js, original line 105-108):**
   ```javascript
   const tokenString = JSON.stringify(token);
   fs.writeFileSync(options.output, tokenString, 'utf8');
   ```
   The tool was outputting **raw JSON** (no base64 encoding).

**Fix:** Updated `tools/issueLicense.js`, `tools/signLicense.js`, and `tools/verifyLicense.js` to use base64 encoding/decoding.

### Issue 2: Public/Private Key Pair Mismatch (CRITICAL)
The public key embedded in `electron/security/publicKey.js` did NOT match the private key in `fennec_license_private.pem`.

**Evidence:**
- Public key in publicKey.js (original): Started with `MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAqkcgpnYnJvGR...`
- Public key derived from fennec_license_private.pem: Started with `MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAynRPH0LmVXhl...`

These are completely different keys. Signatures created with the private key will NEVER verify with the mismatched public key.

**Fix:** Extracted the corr