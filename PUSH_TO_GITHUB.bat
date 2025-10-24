@echo off
REM ============================================
REM Gold Wallet App - Push to GitHub Script
REM ============================================

echo.
echo ========================================
echo  Gold Wallet App - GitHub Push Script
echo ========================================
echo.

REM Step 1: Change branch name to main
echo [1/3] Changing branch name from master to main...
git branch -M main
if errorlevel 1 (
    echo ERROR: Failed to change branch name
    pause
    exit /b 1
)
echo [✓] Branch name changed successfully
echo.

REM Step 2: Add remote origin
echo [2/3] Adding remote origin...
echo Please enter your GitHub username (e.g., goldwallet31):
set /p GITHUB_USER=
if "%GITHUB_USER%"=="" (
    echo ERROR: GitHub username cannot be empty
    pause
    exit /b 1
)

git remote add origin https://github.com/%GITHUB_USER%/gold-wallet-app.git
if errorlevel 1 (
    echo ERROR: Failed to add remote origin
    echo Trying to remove existing remote...
    git remote remove origin
    git remote add origin https://github.com/%GITHUB_USER%/gold-wallet-app.git
)
echo [✓] Remote origin added successfully
echo.

REM Step 3: Push to GitHub
echo [3/3] Pushing to GitHub...
echo.
echo IMPORTANT: You will be prompted for authentication
echo Options:
echo   1. Use Personal Access Token (recommended)
echo   2. Use Git Credential Manager
echo.
echo If using Personal Access Token:
echo   - Username: %GITHUB_USER%
echo   - Password: Paste your Personal Access Token
echo.
pause

git push -u origin main

if errorlevel 1 (
    echo.
    echo ERROR: Failed to push to GitHub
    echo Please check:
    echo   1. Repository exists on GitHub
    echo   2. Personal Access Token is correct
    echo   3. Internet connection is working
    pause
    exit /b 1
)

echo.
echo ========================================
echo [✓] SUCCESS! Project pushed to GitHub!
echo ========================================
echo.
echo Your project is now available at:
echo https://github.com/%GITHUB_USER%/gold-wallet-app
echo.
pause

