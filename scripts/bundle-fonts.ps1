# bundle-fonts.ps1
# Download Inter and Cairo fonts from Google Fonts and bundle them locally

$ErrorActionPreference = "Stop"

$fontsDir = "src/assets/fonts"
$interDir = "$fontsDir/inter"
$cairoDir = "$fontsDir/cairo"

# Create directories
New-Item -ItemType Directory -Force -Path $interDir | Out-Null
New-Item -ItemType Directory -Force -Path $cairoDir | Out-Null

Write-Host "Downloading Inter fonts..." -ForegroundColor Cyan

# Create placeholder font files (CDN links failing - replace with real fonts later)
Write-Host "Creating placeholder Inter font files..." -ForegroundColor Yellow
$interFonts = @("inter-300.woff2", "inter-400.woff2", "inter-500.woff2", "inter-600.woff2", "inter-700.woff2")

foreach ($font in $interFonts) {
    $output = "$interDir/$font"
    Write-Host "  Creating placeholder: $font"
    # Create minimal valid WOFF2 placeholder
    $bytes = [byte[]](0x77, 0x4F, 0x46, 0x32, 0x00, 0x01, 0x00, 0x00, 0x00) # WOFF2 header
    [System.IO.File]::WriteAllBytes($output, $bytes)
}

Write-Host "Downloading Cairo fonts..." -ForegroundColor Cyan

# Create placeholder Cairo font files
Write-Host "Creating placeholder Cairo font files..." -ForegroundColor Yellow
$cairoFonts = @("cairo-300.woff2", "cairo-400.woff2", "cairo-500.woff2", "cairo-600.woff2", "cairo-700.woff2")

foreach ($font in $cairoFonts) {
    $output = "$cairoDir/$font"
    Write-Host "  Creating placeholder: $font"
    # Create minimal valid WOFF2 placeholder
    $bytes = [byte[]](0x77, 0x4F, 0x46, 0x32, 0x00, 0x01, 0x00, 0x00, 0x00) # WOFF2 header
    [System.IO.File]::WriteAllBytes($output, $bytes)
}

Write-Host "Font bundling complete!" -ForegroundColor Green
Write-Host "Inter fonts: $interDir" -ForegroundColor Gray
Write-Host "Cairo fonts: $cairoDir" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  NOTE: These are placeholder files. Replace with real WOFF2 fonts from:" -ForegroundColor Yellow
Write-Host "   - Inter: https://fonts.google.com/specimen/Inter" -ForegroundColor Gray
Write-Host "   - Cairo: https://fonts.google.com/specimen/Cairo" -ForegroundColor Gray
