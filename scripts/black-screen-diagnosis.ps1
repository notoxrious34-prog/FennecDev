# black-screen-diagnosis.ps1

Write-Host "=== BLACK SCREEN DIAGNOSIS ===" -ForegroundColor Yellow

# 1. Search install location
Write-Host "`n[1] Searching install location..."
$possiblePaths = @(
    "$env:LOCALAPPDATA\Programs\Fennec Facturation",
    "$env:PROGRAMFILES\Fennec Facturation",
    "$env:PROGRAMFILES(X86)\Fennec Facturation",
    "C:\Fennec Facturation"
)

$installPath = $null
foreach ($p in $possiblePaths) {
    if (Test-Path $p) {
        $installPath = $p
        Write-Host "OK Found at: $p" -ForegroundColor Green
        break
    }
}

if (-not $installPath) {
    Write-Host "Doing full search..."
    $found = Get-ChildItem "C:\", "$env:LOCALAPPDATA", "$env:APPDATA" `
        -Filter "Fennec Facturation.exe" -Recurse -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($found) {
        $installPath = $found.DirectoryName
        Write-Host "OK Found at: $installPath" -ForegroundColor Green
    } else {
        Write-Host "FAIL Not found anywhere" -ForegroundColor Red
    }
}

# 2. Check app.asar
Write-Host "`n[2] Checking app.asar..."
if ($installPath) {
    $asar = Join-Path $installPath "resources\app.asar"
    $appDir = Join-Path $installPath "resources\app"
    
    if (Test-Path $asar) {
        $sizeMB = [math]::Round((Get-Item $asar).Length/1MB, 1)
        Write-Host "OK app.asar: $sizeMB MB" -ForegroundColor Green
    } elseif (Test-Path $appDir) {
        Write-Host "OK app dir (unpacked)" -ForegroundColor Green
    } else {
        Write-Host "FAIL No app.asar or app dir - BUILD ISSUE" -ForegroundColor Red
    }

    # 3. Check dist inside resources
    Write-Host "`n[3] Checking dist/ inside package..."
    Write-Host "resources contents:"
    Get-ChildItem (Join-Path $installPath "resources") -ErrorAction SilentlyContinue |
        Select-Object Name, @{N="MB";E={[math]::Round($_.Length/1MB,1)}} |
        Format-Table -AutoSize
}

# 4. Check main.js for loadFile path
Write-Host "`n[4] Checking main.js load path..."
$mainJsPaths = @(
    (Join-Path $installPath "resources\app\electron\main.js"),
    (Join-Path $installPath "resources\app.asar\electron\main.js")
)

foreach ($mjPath in $mainJsPaths) {
    if (Test-Path $mjPath) {
        Write-Host "Found main.js at: $mjPath"
        $loadLine = Select-String -Path $mjPath -Pattern "loadFile|loadURL|localhost|dist"
        $loadLine | ForEach-Object { Write-Host "  -> $($_.Line.Trim())" }
    }
}

# 5. Check logs
Write-Host "`n[5] Checking logs..."
$logPaths = @(
    "$env:APPDATA\Fennec Facturation\logs",
    "$env:USERPROFILE\AppData\Roaming\Fennec Facturation\logs"
)

foreach ($logDir in $logPaths) {
    if (Test-Path $logDir) {
        Write-Host "OK Logs at: $logDir"
        Get-ChildItem $logDir | ForEach-Object {
            Write-Host "`n-- $($_.Name) --"
            Get-Content $_.FullName | Select-Object -Last 20
        }
    }
}

# 6. Launch with DevTools
Write-Host "`n[6] Launching with DevTools..."
if ($installPath) {
    $exe = Join-Path $installPath "Fennec Facturation.exe"
    if (Test-Path $exe) {
        Start-Process $exe
        Write-Host "OK Launched -- Press Ctrl+Shift+I in black window"
        Write-Host "   Console tab -> Copy red errors"
    }
}

Write-Host "`n=== END DIAGNOSIS ===" -ForegroundColor Yellow
