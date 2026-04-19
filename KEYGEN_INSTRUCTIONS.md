# License Key Generation — OPERATOR INSTRUCTIONS
## WARNING: Execute these commands on a secure machine. NEVER commit the private key.

### Generate 4096-bit RSA Private Key (keep this FOREVER SECURE and OFFLINE):
```bash
openssl genrsa -out license_private.pem 4096
```

### Extract the Public Key (this one goes into the app):
```bash
openssl rsa -in license_private.pem -pubout -out license_public.pem
```

### To sign a license payload for a customer (run this per-customer on the secure machine):
```bash
echo '{"machineId":"MACHINE_ID_HERE","customerId":"CUSTOMER_ID","expiresAt":"YYYY-MM-DD","plan":"professional","issuedAt":"YYYY-MM-DD"}' > license_payload.json

openssl dgst -sha256 -sign license_private.pem -out license_sig.bin license_payload.json
openssl base64 -in license_sig.bin -out license_sig.b64 -A
```

### The final license key delivered to the customer is a base64-encoded JSON:
### Combine payload + signature into a license token:
```bash
node -e "
const payload = require('fs').readFileSync('license_payload.json', 'utf8');
const sig = require('fs').readFileSync('license_sig.b64', 'utf8').trim();
const token = Buffer.from(JSON.stringify({ payload: JSON.parse(payload), signature: sig }))
  .toString('base64');
console.log('LICENSE TOKEN:', token);
"
```

### Deliver the LICENSE TOKEN string to the customer. This is their license key.
