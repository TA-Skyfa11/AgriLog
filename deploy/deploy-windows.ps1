# ==============================================================================
# AgriLog Deployment Script for Windows Server (PowerShell)
# ==============================================================================
$ErrorActionPreference = "Stop"

Write-Host "[AgriLog] Starting deployment on Windows Server..." -ForegroundColor Cyan

# Navigate to project root directory
$RootDir = Split-Path -Parent $PSScriptRoot
Set-Location $RootDir

Write-Host "1. Pulling latest source code from main branch..." -ForegroundColor Yellow
git fetch origin main
git reset --hard origin/main

Write-Host "2. Installing dependencies and building Backend..." -ForegroundColor Yellow
Set-Location agrilog-backend
npm ci
npm run build

Write-Host "3. Installing dependencies and building Frontend..." -ForegroundColor Yellow
Set-Location ../agrilog-frontend
npm ci
npm run build

Write-Host "4. Starting / Reloading processes with PM2..." -ForegroundColor Yellow
Set-Location ..

# Check for global PM2 or fallback to npx
$pm2Cmd = Get-Command pm2 -ErrorAction SilentlyContinue
if ($pm2Cmd) {
    try {
        pm2 reload ecosystem.config.js --update-env
    }
    catch {
        pm2 start ecosystem.config.js
    }
    pm2 save
}
else {
    try {
        npx --yes pm2 reload ecosystem.config.js --update-env
    }
    catch {
        npx --yes pm2 start ecosystem.config.js
    }
    npx --yes pm2 save
}

Write-Host "[AgriLog] Deployment completed successfully on Windows Server!" -ForegroundColor Green
