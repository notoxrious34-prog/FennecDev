# Generate SHA256 checksums for all EXE files
Get-ChildItem "dist-electron\*.exe" | ForEach-Object {
    $hash = (Get-FileHash $_.FullName -Algorithm SHA256).Hash.ToLower()
    $name = $_.Name
    "$hash  $name"
} | Out-File "dist-electron\SHA256SUMS.txt" -Encoding UTF8

Write-Host "SHA256SUMS.txt generated"
Get-Content "dist-electron\SHA256SUMS.txt"
