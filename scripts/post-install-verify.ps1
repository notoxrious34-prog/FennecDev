# post-install-verify.ps1
# Run after installer completes

Write-Host ""
Write-Host "=========================================="
Write-Host "POST-INSTALL VERIFICATION - v3.2.0"
Write-Host "=========================================="
Write-Host ""

$results = @{}

# 1. Install Path
$installPath = "$env:LOCALAPPDATA\Programs\Fennec Facturation"
$results["Install Path"] = Test-Path $installPath
Write-Host "1. Install path : $(if($results['Install Path']){'OK'}else{'FAIL'}) $installPath"

# 2. Main Executable
$mainExe = "$installPath\Fennec Facturation.exe"
$results["Main EXE"] = Test-Path $mainExe
Write-Host "2. Main EXE     : $(if($results['Main EXE']){'OK'}else{'FAIL'})"

# 3. Shortcuts
$desktop   = Test-Path "$env:USERPROFILE\Desktop\Fennec Facturation.lnk"
$startMenu = Test-Path "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Fennec Facturation"
$results["Desktop"]    = $desktop
$results["Start Menu"] = $startMenu
Write-Host "3. Desktop shortcut : $(if($desktop){'OK'}else{'FAIL'})"
Write-Host "4. Start Menu entry : $(if($startMenu){'OK'}else{'FAIL'})"

# 4. Registry Uninstall Entry
$uninstall = Get-ItemProperty `
    "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*" `
    -ErrorAction SilentlyContinue |
    Where-Object { $_.DisplayName -like "*Fennec Facturation*" -and $_.DisplayVersion -like "3.2*" }

$results["Registry"] = $null -ne $uninstall
Write-Host "5. Registry entry   : $(if($results['Registry']){'OK v' + $uninstall.DisplayVersion}else{'FAIL'})"

# 5. Old v3.0.1 Status
$old301 = Get-ItemProperty `
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*" `
    -ErrorAction SilentlyContinue |
    Where-Object { $_.DisplayName -like "*Fennec*" -and $_.DisplayVersion -like "3.0*" }

Write-Host "6. Old v3.0.1       : $(if($old301){'WARNING - Still registered - uninstall manually'}else{'OK - Cleaned'})"

# 6. Launch App
Write-Host ""
Write-Host "Launching app for visual verification..."
if (Test-Path $mainExe) {
    Start-Process $mainExe
    Start-Sleep -Seconds 4
    
    $process = Get-Process -Name "Fennec Facturation" -ErrorAction SilentlyContinue
    $results["App Running"] = $null -ne $process
    Write-Host "7. App process      : $(if($results['App Running']){'OK - Running (PID: ' + $process.Id + ')'}else{'FAIL - Not found'})"
}
else {
    Write-Host "7. App process      : FAIL - EXE not found"
}

# Summary
Write-Host ""
Write-Host "=========================================="
$passed = ($results.Values | Where-Object { $_ -eq $true }).Count
$total  = $results.Count
Write-Host "  Automated checks: $passed/$total passed"
Write-Host ""
Write-Host "  Visual checks needed (report manually):"
Write-Host "  [ ] Inter font renders in EN/FR text"
Write-Host "  [ ] Cairo font renders in Arabic text"
Write-Host "  [ ] RTL layout correct in Arabic mode"
Write-Host "  [ ] License screen appears correctly"
Write-Host "  [ ] App works with network disabled"
Write-Host "=========================================="
