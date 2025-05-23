# PowerShell script to install Cursor rules

# Create the .cursor/rules directory if it doesn't exist
$rulesDir = ".cursor\rules"
if (-not (Test-Path $rulesDir)) {
    New-Item -ItemType Directory -Path $rulesDir -Force
    Write-Host "Created $rulesDir directory"
}

# Copy all .mdc files to the rules directory
$sourceFiles = Get-ChildItem -Path "*.mdc"
foreach ($file in $sourceFiles) {
    Copy-Item -Path $file.FullName -Destination $rulesDir
    Write-Host "Copied $($file.Name) to $rulesDir"
}

Write-Host "Installation complete! Rules are now available in your Cursor IDE." 