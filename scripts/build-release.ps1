# scripts/build-release.ps1
# ════════════════════════════════════════════════════════════════
# Local Release Build — Fennec Facturation
# Usage: .\scripts\build-release.ps1 -Version "3.2.0"
# ════════════════════════════════════════════════════════════════

param(
  [Parameter(Mandatory=$true)]
  [string]$Version,

  [switch]$SkipTests = $false,
  [switch]$DryRun    = $false
)

$ErrorActionPreference = "Stop"
$StartTime = Get-Date

# ── Banner ────────────────────────────────────────────────────
Write-Host ""
Write-Host "===================================================="
Write-Host "  Fennec Facturation - Release Build"
Write-Host "  Version : v$Version"
Write-Host "  Date    : $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
Write-Host "===================================================="
Write-Host ""

# ── Step 1: Validate version format ──────────────────────────
if ($Version -notmatch '^\d+\.\d+\.\d+$') {
  Write-Error "[ERROR] Invalid version format. Use X.Y.Z format like 3.2.0"
  exit 1
}
Write-Host "[OK] Version format valid: v$Version"

# ── Step 2: Run tests ─────────────────────────────────────────
if (-not $SkipTests) {
  Write-Host ""
  Write-Host "[TEST] Running test suite..."
  npm run test
  if ($LASTEXITCODE -ne 0) {
    Write-Error "[ERROR] Tests failed - aborting release build"
    exit 1
  }
  Write-Host "[OK] All tests passing"
} else {
  Write-Host "[WARN] Tests skipped (--SkipTests flag)"
}

# ── Step 3: Update version in package.json ────────────────────
Write-Host ""
Write-Host "[INFO] Updating package.json version..."
$pkg = Get-Content "package.json" | ConvertFrom-Json
$oldVersion = $pkg.version
$pkg.version = $Version
$pkg | ConvertTo-Json -Depth 10 | Out-File "package.json" -Encoding UTF8
Write-Host "   $oldVersion -> $Version"

# ── Step 4: Build frontend ────────────────────────────────────
Write-Host ""
Write-Host "[BUILD] Building Vite frontend..."
npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Error "[ERROR] Vite build failed"
  exit 1
}
Write-Host "[OK] Frontend built"

# ── Step 5: Build Electron package ───────────────────────────
if (-not $DryRun) {
  Write-Host ""
  Write-Host "[BUILD] Building Electron packages (NSIS + MSI + Portable)..."
  npm run electron:build -- --win
  if ($LASTEXITCODE -ne 0) {
    Write-Error "[ERROR] Electron build failed"
    exit 1
  }
} else {
  Write-Host "[INFO] DryRun mode - skipping electron build"
}

# ── Step 6: Verify artifacts ─────────────────────────────────
Write-Host ""
Write-Host "[VERIFY] Verifying artifacts..."

$artifacts = Get-ChildItem "dist-electron\" -Include "*.exe","*.msi" -Recurse
if ($artifacts.Count -eq 0) {
  Write-Error "[ERROR] No artifacts found in dist-electron\"
  exit 1
}

foreach ($artifact in $artifacts) {
  $sizeMB = [math]::Round($artifact.Length / 1MB, 1)
  $hash   = (Get-FileHash $artifact.FullName -Algorithm SHA256).Hash.ToLower()
  Write-Host "  [OK] $($artifact.Name)"
  Write-Host "       Size : $sizeMB MB"
  Write-Host "       SHA256: $hash"
  Write-Host ""
}

# ── Step 7: Generate checksums ────────────────────────────────
Write-Host "[CHECKSUM] Generating SHA256SUMS.txt..."
$checksumFile = "dist-electron\SHA256SUMS.txt"
$lines = @(
  "# Fennec Facturation v$Version",
  "# Build Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
  "# Verify: certutil -hashfile <filename> SHA256",
  ""
)
foreach ($artifact in $artifacts) {
  $hash = (Get-FileHash $artifact.FullName -Algorithm SHA256).Hash.ToLower()
  $lines += "$hash  $($artifact.Name)"
}
$lines | Out-File $checksumFile -Encoding UTF8
Write-Host "[OK] SHA256SUMS.txt created"

# ── Summary ───────────────────────────────────────────────────
$elapsed = (Get-Date) - $StartTime
Write-Host ""
Write-Host "===================================================="
Write-Host "  BUILD COMPLETE"
Write-Host "===================================================="
Write-Host "  Version  : v$Version"
Write-Host "  Duration : $([math]::Round($elapsed.TotalMinutes, 1)) minutes"
Write-Host "  Output   : dist-electron\"
Write-Host "===================================================="
Write-Host ""
Write-Host "[NEXT] Next steps:"
Write-Host "  1. Test the installer locally"
Write-Host "  2. git tag v$Version"
Write-Host "  3. git push --tags  (triggers GitHub Actions)"
Write-Host "  4. Review draft release on GitHub"
Write-Host "  5. Publish release"
