# SECURITY NOTICE — Fennec Facturation v3.0.0 Deprecation

**Date:** 2025-04-19
**Affected Version:** v3.0.0
**Replacement Version:** v3.0.1

## Issue

The v3.0.0 installer contains a **placeholder RSA public key** in the license verification system. This means:
- The license verification system is **non-functional** in v3.0.0
- Customers cannot activate the application with a valid license
- The application will block at startup with a license error

## Action Required

**ALL customers MUST upgrade to v3.0.1.**

- Do NOT distribute v3.0.0 installers to any customers
- Replace any distributed v3.0.0 installers with v3.0.1
- No database migration is required — existing data is fully compatible
- License files (`.license`) issued for v3.0.0 remain valid — no re-activation needed

## What Changed in v3.0.1

- Embedded the actual 4096-bit RSA public key for license verification
- Fixed `scripts/i18nAudit.js` parsing bug (ISSUE-005)
- All other functionality unchanged from v3.0.0

## Verification

To verify you are using v3.0.1:
- Check the installer filename: `Fennec Facturation-3.0.1.exe`
- Check the application version in Settings → About
- The v3.0.0 installer was named `Fennec Facturation-3.0.0.exe`

## For Operators

If you have already distributed v3.0.0 to customers:
1. Contact them immediately with the v3.0.1 installer
2. Instruct them to uninstall v3.0.0 and install v3.0.1
3. Their existing data and license file will work without changes
4. No database migration or re-activation is required

---

**This notice is permanent. Do not remove this file.**
