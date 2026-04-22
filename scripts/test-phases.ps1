# Manual Testing Phases for Sprint v3.2

Write-Host "=========================================="
Write-Host "MANUAL TESTING PHASES - v3.2.0"
Write-Host "=========================================="
Write-Host ""

# PHASE 1 - NSIS Installer Check
Write-Host "=========================================="
Write-Host "PHASE 1 - NSIS Installer Check"
Write-Host "=========================================="
$installPath = "$env:LOCALAPPDATA\Programs\Fennec Facturation"
if (Test-Path $installPath) {
    Write-Host "OK Install path exists: $installPath"
    Get-ChildItem $installPath | Select-Object Name, @{N="KB";E={[math]::Round($_.Length/1KB,1)}}
}
else {
    Write-Host "FAIL Install path NOT found: $installPath"
}

$desktop = Test-Path "$env:USERPROFILE\Desktop\Fennec Facturation.lnk"
$startMenu = Test-Path "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Fennec Facturation"
Write-Host "Desktop shortcut : $(if($desktop){'OK'}else{'FAIL'})"
Write-Host "Start Menu entry : $(if($startMenu){'OK'}else{'FAIL'})"
Write-Host ""

# PHASE 2 - Portable Check
Write-Host "=========================================="
Write-Host "PHASE 2 - Portable Check"
Write-Host "=========================================="
$programFiles = Get-ChildItem "C:\Program Files\Fennec*" -ErrorAction SilentlyContinue
Write-Host "Files in Program Files: $(if($programFiles){'WARNING - Found'}else{'OK - Clean'})"
Write-Host ""

# PHASE 3 - SmartScreen/Signature Check
Write-Host "=========================================="
Write-Host "PHASE 3 - SmartScreen/Signature Check"
Write-Host "=========================================="
$exe = "dist-electron\Fennec Facturation Setup 3.2.0.exe"
if (Test-Path $exe) {
    $sig = Get-AuthenticodeSignature $exe
    Write-Host "Signature Status : $($sig.Status)"
    Write-Host "Signer           : $($sig.SignerCertificate.Subject)"
}
else {
    Write-Host "FAIL EXE not found"
}
Write-Host ""

# PHASE 4 - SHA256 Checksum Check
Write-Host "=========================================="
Write-Host "PHASE 4 - SHA256 Checksum Check"
Write-Host "=========================================="
if (Test-Path "dist-electron\SHA256SUMS.txt") {
    Write-Host "OK SHA256SUMS.txt exists"
    Get-Content "dist-electron\SHA256SUMS.txt"
    
    $actualHash = (Get-FileHash "dist-electron\Fennec Facturation Setup 3.2.0.exe" -Algorithm SHA256).Hash.ToLower()
    $storedLine = Get-Content "dist-electron\SHA256SUMS.txt" | Where-Object { $_ -match "Setup" }
    if ($storedLine) {
        $storedHash = ($storedLine -split "\s+")[0]
        if ($actualHash -eq $storedHash) {
            Write-Host "OK SHA256 verified - file integrity confirmed"
        }
        else {
            Write-Host "FAIL SHA256 MISMATCH"
            Write-Host "   Actual : $actualHash"
            Write-Host "   Stored : $storedHash"
        }
    }
}
else {
    Write-Host "FAIL SHA256SUMS.txt NOT found"
}
Write-Host ""

# PHASE 5 - MSI Check
Write-Host "=========================================="
Write-Host "PHASE 5 - MSI Check"
Write-Host "=========================================="
$msi = "dist-electron\Fennec Facturation 3.2.0.msi"
if (Test-Path $msi) {
    $size = [math]::Round((Get-Item $msi).Length / 1MB, 1)
    Write-Host "OK MSI exists: $size MB"
    
    try {
        $installer = New-Object -ComObject WindowsInstaller.Installer
        $db = $installer.OpenDatabase($msi, 0)
        $view = $db.OpenView("SELECT Value FROM Property WHERE Property='ProductVersion'")
        $view.Execute()
        $record = $view.Fetch()
        if ($record) {
            Write-Host "   Product Version: $($record.StringData(1))"
        }
    }
    catch {
        Write-Host "WARNING Could not read MSI metadata (WindowsInstaller COM object)"
    }
}
else {
    Write-Host "FAIL MSI NOT found"
}
Write-Host ""

Write-Host "=========================================="
Write-Host "Testing complete"
Write-Host "=========================================="
