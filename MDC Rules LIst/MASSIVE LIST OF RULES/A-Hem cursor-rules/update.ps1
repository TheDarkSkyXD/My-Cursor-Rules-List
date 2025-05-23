# PowerShell script to update existing Cursor rules

# Define the rules directory
$rulesDir = ".cursor\rules"

# Check if the rules directory exists
if (-not (Test-Path $rulesDir)) {
    Write-Host "Error: $rulesDir directory not found. Please run install.ps1 first." -ForegroundColor Red
    exit 1
}

# Get a list of all .mdc files in the current directory
$sourceFiles = Get-ChildItem -Path "*.mdc"

# Count for statistics
$updatedCount = 0
$newCount = 0

# Copy each .mdc file to the rules directory
foreach ($file in $sourceFiles) {
    $destPath = Join-Path -Path $rulesDir -ChildPath $file.Name
    
    if (Test-Path $destPath) {
        # File exists, check if it's different
        $sourceContent = Get-Content -Path $file.FullName -Raw
        $destContent = Get-Content -Path $destPath -Raw
        
        if ($sourceContent -ne $destContent) {
            Copy-Item -Path $file.FullName -Destination $rulesDir -Force
            Write-Host "Updated: $($file.Name)" -ForegroundColor Yellow
            $updatedCount++
        } else {
            Write-Host "Unchanged: $($file.Name)" -ForegroundColor Gray
        }
    } else {
        # File doesn't exist, copy it
        Copy-Item -Path $file.FullName -Destination $rulesDir
        Write-Host "Added: $($file.Name)" -ForegroundColor Green
        $newCount++
    }
}

# Print summary
Write-Host "`nUpdate complete!" -ForegroundColor Cyan
Write-Host "$updatedCount rules updated, $newCount new rules added." -ForegroundColor Cyan
Write-Host "Your Cursor rules are now up to date." -ForegroundColor Cyan 