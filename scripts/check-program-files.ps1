# Check Program Files for Fennec installations
$fennecFiles = Get-ChildItem "C:\Program Files\Fennec*" -ErrorAction SilentlyContinue

if ($fennecFiles) {
    foreach ($item in $fennecFiles) {
        Write-Host "Found: $($item.FullName)"
        Write-Host "  Created : $($item.CreationTime)"
        Write-Host "  Modified: $($item.LastWriteTime)"
        
        if ($item.CreationTime -lt (Get-Date).AddDays(-1)) {
            Write-Host "  WARNING - Old (likely from previous installation)"
        }
        else {
            Write-Host "  ERROR - New (Portable writing to Program Files?)"
        }
    }
    
    # Check uninstall registry
    $uninstallKey = Get-ItemProperty `
        "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*" `
        -ErrorAction SilentlyContinue |
        Where-Object { $_.DisplayName -like "*Fennec*" }
    
    if ($uninstallKey) {
        Write-Host ""
        Write-Host "Registry entry found:"
        Write-Host "  Name   : $($uninstallKey.DisplayName)"
        Write-Host "  Version: $($uninstallKey.DisplayVersion)"
        Write-Host "  WARNING - This is from NSIS installer (not Portable)"
    }
}
else {
    Write-Host "OK - No Fennec files in Program Files"
}
