# ============================================
# Gold Wallet App - Push to GitHub Script
# ============================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Gold Wallet App - GitHub Push Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Change branch name to main
Write-Host "[1/3] Changing branch name from master to main..." -ForegroundColor Yellow
git branch -M main
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to change branch name" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[✓] Branch name changed successfully" -ForegroundColor Green
Write-Host ""

# Step 2: Add remote origin
Write-Host "[2/3] Adding remote origin..." -ForegroundColor Yellow
$GITHUB_USER = Read-Host "Please enter your GitHub username (e.g., goldwallet31)"
if ([string]::IsNullOrEmpty($GITHUB_USER)) {
    Write-Host "ERROR: GitHub username cannot be empty" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

git remote add origin "https://github.com/$GITHUB_USER/gold-wallet-app.git"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Remote already exists, removing and re-adding..." -ForegroundColor Yellow
    git remote remove origin
    git remote add origin "https://github.com/$GITHUB_USER/gold-wallet-app.git"
}
Write-Host "[✓] Remote origin added successfully" -ForegroundColor Green
Write-Host ""

# Step 3: Push to GitHub
Write-Host "[3/3] Pushing to GitHub..." -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANT: You will be prompted for authentication" -ForegroundColor Cyan
Write-Host "Options:" -ForegroundColor Cyan
Write-Host "  1. Use Personal Access Token (recommended)" -ForegroundColor Cyan
Write-Host "  2. Use Git Credential Manager" -ForegroundColor Cyan
Write-Host ""
Write-Host "If using Personal Access Token:" -ForegroundColor Cyan
Write-Host "  - Username: $GITHUB_USER" -ForegroundColor Cyan
Write-Host "  - Password: Paste your Personal Access Token" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to continue"

git push -u origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Failed to push to GitHub" -ForegroundColor Red
    Write-Host "Please check:" -ForegroundColor Red
    Write-Host "  1. Repository exists on GitHub" -ForegroundColor Red
    Write-Host "  2. Personal Access Token is correct" -ForegroundColor Red
    Write-Host "  3. Internet connection is working" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "[✓] SUCCESS! Project pushed to GitHub!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your project is now available at:" -ForegroundColor Green
Write-Host "https://github.com/$GITHUB_USER/gold-wallet-app" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"

