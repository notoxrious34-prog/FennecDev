# scripts/create-icon.ps1
# Creates placeholder icon for Fennec Facturation

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.IO

New-Item -ItemType Directory -Force -Path "build\icons" | Out-Null

# Create placeholder PNG
$bmp = New-Object System.Drawing.Bitmap(256, 256)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::FromArgb(255, 30, 100, 200))
$font = New-Object System.Drawing.Font("Arial", 140, [System.Drawing.FontStyle]::Bold)
$brush = [System.Drawing.Brushes]::White
$g.DrawString("F", $font, $brush, 55, 50)
$tmpPng = "build\icons\icon_tmp.png"
$bmp.Save($tmpPng, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()

Write-Host "Placeholder PNG created: $tmpPng"

# Convert PNG to ICO
$pngBytes = [System.IO.File]::ReadAllBytes($tmpPng)
$icoFile = "build\icons\icon.ico"

# ICO file structure
$icoHeader = [byte[]](0, 0, 1, 0, 1, 0)  # Reserved, Type=1 (ICO), Count=1
$entryHeader = [byte[]](0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)  # Width=256, Height=256, etc.

# Calculate data offset
$dataOffset = 22 + $pngBytes.Length
$entryHeader[12] = [byte]($dataOffset % 256)
$entryHeader[13] = [byte]([math]::Floor($dataOffset / 256))
$entryHeader[14] = [byte]($pngBytes.Length % 256)
$entryHeader[15] = [byte]([math]::Floor($pngBytes.Length / 256))

$icoBytes = $icoHeader + $entryHeader + $pngBytes
[System.IO.File]::WriteAllBytes($icoFile, $icoBytes)

Write-Host "ICO created: $icoFile"
Write-Host "Note: This is a simple PNG-in-ICO wrapper. For production, use a proper icon editor."
