# ==============================================================================
# AgriLog Deployment Script for Windows Server (PowerShell)
# ==============================================================================
$ErrorActionPreference = "Stop"

Write-Host "🚀 [AgriLog] Bắt đầu triển khai trên Windows Server..." -ForegroundColor Cyan

# Di chuyển về thư mục gốc của dự án
$RootDir = Split-Path -Parent $PSScriptRoot
Set-Location $RootDir

Write-Host "📥 1. Kéo mã nguồn mới nhất từ nhánh main..." -ForegroundColor Yellow
git fetch origin main
git reset --hard origin/main

Write-Host "🔨 2. Cài đặt và build Backend..." -ForegroundColor Yellow
Set-Location agrilog-backend
npm ci
npm run build

Write-Host "🎨 3. Cài đặt và build Frontend..." -ForegroundColor Yellow
Set-Location ../agrilog-frontend
npm ci
npm run build

Write-Host "⚡ 4. Khởi động / Tải lại tiến trình với PM2..." -ForegroundColor Yellow
Set-Location ..

# Kiểm tra pm2 toàn cục hoặc dùng npx
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

Write-Host "✅ [AgriLog] Triển khai thành công trên Windows Server!" -ForegroundColor Green
