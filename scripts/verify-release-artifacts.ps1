# verify-release-artifacts.ps1
# Run after downloading artifacts from GitHub Actions

param(
  [string]$ArtifactsDir = ".\release-artifacts"
)

Write-Host "=========================================="
Write-Host "RELEASE ARTIFACT VERIFICATION - v3.2.0"
Write-Host "=========================================="

# 1. Expected files
$expected = @(
  "Fennec Facturation Setup 3.2.0.exe",
  "Fennec Facturation-3.2.0-portable.exe",
  "SHA256SUMS.txt"
)

Write-Host "`n[1] Checking expected files..."
$allFound = $true
foreach ($file in $expected) {
  $path = Join-Path $ArtifactsDir $file
  if (Test-Path $path) {
    $sizeMB = [math]::Round((Get-Item $path).Length/1MB, 1)
    Write-Host "  OK $file ($sizeMB MB)"
  } else {
    Write-Host "  FAIL MISSING: $file"
    $allFound = $false
  }
}

# 2. SHA256 verification
Write-Host "`n[2] Verifying SHA256 checksums..."
$checksumFile = Join-Path $ArtifactsDir "SHA256SUMS.txt"

if (Test-Path $checksumFile) {
  $checksumLines = Get-Content $checksumFile |
    Where-Object { $_ -match "\.exe|\.msi" }

  foreach ($line in $checksumLines) {
    $parts    = $line -split "\s+", 2
    $stored   = $parts[0].Trim()
    $filename = $parts[1].Trim()
    $filepath = Join-Path $ArtifactsDir $filename

    if (Test-Path $filepath) {
      $actual = (Get-FileHash $filepath -Algorithm SHA256).Hash.ToLower()
      if ($actual -eq $stored) {
        Write-Host "  OK $filename - checksum OK"
      } else {
        Write-Host "  FAIL $filename - CHECKSUM MISMATCH"
        Write-Host "     Expected: $stored"
        Write-Host "     Actual  : $actual"
        $allFound = $false
      }
    }
  }
} else {
  Write-Host "  FAIL SHA256SUMS.txt not found"
  $allFound = $false
}

# 3. File size sanity check
Write-Host "`n[3] Size sanity check (must be > 50MB)..."
Get-ChildItem $ArtifactsDir -Include "*.exe","*.msi" -Recurse |
  ForEach-Object {
    $sizeMB = [math]::Round($_.Length/1MB, 1)
    $status = if ($sizeMB -gt 50) { "OK" } else { "FAIL TOO SMALL" }
    Write-Host "  $status $_.Name`: $sizeMB MB"
    if ($sizeMB -le 50) { $allFound = $false }
  }

# Summary
Write-Host ""
Write-Host "=========================================="
if ($allFound) {
  Write-Host "  OK ALL CHECKS PASSED - Ready to publish"
  Write-Host ""
  Write-Host "  Next commands:"
  Write-Host "  git tag v3.2.1"
  Write-Host "  git push origin v3.2.1"
} else {
  Write-Host "  FAIL CHECKS FAILED - Do not publish"
  Write-Host "  Send error output for diagnosis"
}
Write-Host "=========================================="
