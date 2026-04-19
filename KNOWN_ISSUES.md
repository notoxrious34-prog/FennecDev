# Known Issues — Fennec Facturation v3.0 ERP

> Last Updated: 2025-04-19
> Version: 3.0.0

## Critical / High
None. All critical and high severity issues were resolved before release.

## Medium Severity

### [ISSUE-001] — Dependency Installation Issue on Windows
- **Observed:** `npm ci` fails with EPERM error on `lightningcss-win32-x64-msvc/lightningcss.win32-x64-msvc.node`
- **Workaround:** Use `npm install` instead of `npm ci` for development builds
- **Root Cause:** Antivirus or file locking on Windows prevents deletion of native module files
- **Planned Fix:** Document in deployment instructions to run as Administrator or disable antivirus temporarily during installation

### [ISSUE-002] — Build Environment Issue
- **Observed:** `vite` command not recognized after dependency installation failure
- **Workaround:** Dependencies need to be reinstalled properly before building
- **Root Cause:** Incomplete dependency installation due to EPERM error
- **Planned Fix:** Resolve underlying file permission issue with native modules

### [ISSUE-005] — i18nAudit.js Script Parsing Issue ✅ RESOLVED in v3.0.1
- **Was:** Regex-based key extraction caused false negatives on certain key patterns. The script reported FR and EN sections have only 133 keys while AR has 192 keys.
- **Fix:** Replaced regex with `JSON.parse()` + recursive `flattenKeys()` function. The new implementation reads from locale JSON files (ar.json, fr.json, en.json) instead of parsing translations.ts with regex. It handles both flat and nested JSON structures, validates JSON syntax, detects duplicate keys, reports empty values as warnings, and supports `--verbose` and `--summary` flags.
- **File changed:** `scripts/i18nAudit.js` (complete rewrite)
- **Verification:** Script correctly detects deliberately introduced missing keys and exits 0 when all translations are complete. Current status: 192 keys present in all 3 languages (EN, FR, AR).

## Low Severity

### [ISSUE-003] — Tajawal font requires internet on first Arabic use (if using Google Fonts CDN)
- **Observed:** On first language switch to Arabic on an offline machine, the font
  falls back to the system sans-serif until the next launch with internet.
- **Workaround:** If offline operation is required, embed Tajawal as a local font:
  see `src/styles/global.css` — replace the Google Fonts `@import` with local `@font-face`
  declarations pointing to font files in `public/fonts/tajawal/`.
- **Root Cause:** Google Fonts CDN requires internet connectivity.
- **Planned Fix:** Bundle fonts locally in v3.1.0.

### [ISSUE-004] — Window restore position may be off by one monitor
- **Observed:** If the application was last used on a secondary monitor that is
  subsequently disconnected, the window may appear off-screen on next launch.
- **Workaround:** Delete `window-state.json` from the userData directory.
  The application will open at the default position on the primary monitor.
- **Root Cause:** The window state saves absolute coordinates without validating
  that the saved position falls within an available display boundary.
- **Planned Fix:** Add display boundary validation to window state management in v3.1.0.

## Security Notices

### [SEC-001] — Code signing not implemented in v3.0.0
- Windows SmartScreen and macOS Gatekeeper will show security warnings for unsigned installers.
- **Operator Action:** Instruct customers to click "More info → Run anyway" (Windows) or
  "System Preferences → Security → Open Anyway" (macOS).
- **Planned Fix:** Obtain code signing certificates for v3.1.0.

### [SEC-002] — serialize-javascript vulnerability in build tooling
- **Severity:** High
- **CVE:** GHSA-5c6j-r48x-rmvq, GHSA-qj8w-gfj5-8c6v
- **Affected Component:** `@rollup/plugin-terser` (build-time only, not runtime)
- **Risk Level:** Low — This vulnerability is in the build tooling chain, not in the runtime application code.
  Since this is a desktop Electron app (not a web app), and the vulnerability is in the build process
  (terser minification), the risk is lower than in a web context where user input could be processed
  through the vulnerable code.
- **Workaround:** Accept risk for v3.0.0 — build tooling runs in a controlled development environment.
- **Planned Fix:** Upgrade vite-plugin-pwa to version that uses non-vulnerable terser in v3.1.0.
  Note: This requires a breaking change upgrade.

### [SEC-003] — Google Fonts CDN in Content Security Policy
- The CSP allows connections to `fonts.googleapis.com` and `fonts.gstatic.com`.
- This means the application makes outbound HTTPS requests on first use.
- **Risk Level:** Low — Google Fonts is a legitimate CDN.
- **Planned Fix:** Bundle fonts locally (resolves [ISSUE-003] simultaneously) in v3.1.0.
