# Fix script for Expo Windows path issues
Write-Host "Creating .expo directory structure..." -ForegroundColor Green

$directories = @(
    ".expo",
    ".expo\metro",
    ".expo\metro\externals"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "Created: $dir" -ForegroundColor Yellow
    } else {
        Write-Host "Exists: $dir" -ForegroundColor Gray
    }
}

Write-Host "`nClearing Metro cache..." -ForegroundColor Green
npx expo start --clear

