# PowerShell script to clear GitHub Actions cache for the REX repository
# Requires GitHub CLI (gh) to be installed and authenticated

# List all caches and delete them
Write-Host "Listing GitHub Actions caches..." -ForegroundColor Cyan
gh cache list

Write-Host "Deleting all GitHub Actions caches..." -ForegroundColor Yellow
$caches = gh cache list | ForEach-Object { ($_ -split "\s+")[0] }
foreach ($cache in $caches) {
    if ($cache -and $cache -ne "ID") {
        Write-Host "Deleting cache: $cache" -ForegroundColor Red
        gh cache delete $cache --confirm
    }
}

Write-Host "Cache clearing complete. Re-run your workflow for a fresh build." -ForegroundColor Green
