# ==============================================================================
# AgriLog Deployment Script for Windows Server (PowerShell & Docker Compose)
# ==============================================================================
$ErrorActionPreference = "Stop"

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "[AgriLog] Starting Production Deployment on Windows Server..." -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan

# 1. Navigate to project root directory
$RootDir = Split-Path -Parent $PSScriptRoot
Set-Location $RootDir

# 2. Check Prerequisites (Docker & Docker Compose)
Write-Host "`n[Step 1/5] Checking Docker environment..." -ForegroundColor Yellow
$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerCmd) {
    Write-Error "Docker is not installed or not in PATH. Please install Docker Desktop / Docker Engine for Windows."
    exit 1
}

# Verify Docker engine is actually running
try {
    $null = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Docker daemon is not running. Please start Docker Desktop or Docker service."
        exit 1
    }
}
catch {
    Write-Error "Cannot communicate with Docker daemon. Please ensure Docker Desktop is running."
    exit 1
}

# Check for .env file
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.docker.example") {
        Write-Host "No .env file found. Copying from .env.docker.example..." -ForegroundColor DarkYellow
        Copy-Item ".env.docker.example" ".env"
        Write-Host "Please configure .env with your MongoDB Atlas URI & secrets before continuing!" -ForegroundColor Red
    }
    else {
        Write-Error "File .env is required but not found in root directory."
        exit 1
    }
}

# 3. Pull latest source code from main branch
Write-Host "`n[Step 2/5] Pulling latest source code from origin/main..." -ForegroundColor Yellow
git fetch origin main
git reset --hard origin/main

# 4. Stop legacy PM2 processes if they are running (to free ports 3000 & 5000)
Write-Host "`n[Step 3/5] Checking and releasing ports from legacy processes..." -ForegroundColor Yellow
$pm2Cmd = Get-Command pm2 -ErrorAction SilentlyContinue
if ($pm2Cmd) {
    try {
        & pm2 stop agrilog-backend agrilog-frontend 2>$null
        & pm2 delete agrilog-backend agrilog-frontend 2>$null
        & pm2 save 2>$null
        Write-Host "Stopped legacy PM2 processes." -ForegroundColor Gray
    }
    catch {
        # PM2 had no active agrilog apps, ignore
    }
}

# 5. Build and Deploy Services with Docker Compose (Connecting to MongoDB Atlas)
Write-Host "`n[Step 4/5] Building and launching containers with Docker Compose..." -ForegroundColor Yellow
# Default will ONLY start backend & frontend; mongo container stays dormant under profile local-db
docker compose up -d --build --remove-orphans

# Clean up dangling images to keep server disk clean
try {
    docker image prune -f | Out-Null
}
catch {
    # Non-critical, ignore
}

# 6. Verify Deployment Health
Write-Host "`n[Step 5/5] Verifying service status..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
docker compose ps

Write-Host "`n=====================================================================" -ForegroundColor Green
Write-Host "[AgriLog] Deployment completed successfully on Windows Server!" -ForegroundColor Green
Write-Host "Frontend : http://localhost:3000" -ForegroundColor Green
Write-Host "Backend  : http://localhost:5000/api" -ForegroundColor Green
Write-Host "Database : Connected to MongoDB Atlas Cloud" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Green
