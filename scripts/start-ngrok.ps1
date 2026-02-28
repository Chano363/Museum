# Museum 3D Exhibition System - ngrok Startup Script
# Usage:
# 1. Register at https://ngrok.com to get an authtoken
# 2. Update ngrok.yml with your authtoken
# 3. Run this script: .\start-ngrok.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Museum 3D Exhibition System - ngrok" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if ngrok is available
$ngrokPath = "./ngrok.exe"
if (Test-Path $ngrokPath) {
    try {
        $ngrokVersion = & $ngrokPath version
        Write-Host "✓ ngrok found: $ngrokVersion" -ForegroundColor Green
    } catch {
        Write-Host "✗ ngrok executable found but not working!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✗ ngrok.exe not found!" -ForegroundColor Red
    Write-Host "  Please download ngrok from https://ngrok.com/download" -ForegroundColor Yellow
    Write-Host "  and place it in the project root directory" -ForegroundColor Yellow
    exit 1
}

# Check configuration file
if (-not (Test-Path "ngrok.yml")) {
    Write-Host "✗ ngrok.yml configuration file not found!" -ForegroundColor Red
    exit 1
}

# Check if authtoken is configured
$configContent = Get-Content "ngrok.yml" -Raw
if (-not ($configContent -match "authtoken:\s*\w+")) {
    Write-Host "✗ Please configure authtoken in ngrok.yml!" -ForegroundColor Red
    Write-Host "  1. Visit https://ngrok.com to register" -ForegroundColor Yellow
    Write-Host "  2. Get your authtoken from Dashboard" -ForegroundColor Yellow
    Write-Host "  3. Update ngrok.yml with your authtoken" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Authtoken configuration found" -ForegroundColor Green

Write-Host "✓ Configuration file check passed" -ForegroundColor Green
Write-Host ""

# Start backend
Write-Host "Starting backend service..." -ForegroundColor Cyan
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    $env:PORT = 5001
    python backend/app.py
}

# Wait for backend to start
Write-Host "Waiting for backend to start (3 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Start ngrok
Write-Host ""
Write-Host "Starting ngrok tunnel..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the service" -ForegroundColor Yellow
Write-Host ""

# Start ngrok with configuration file
& $ngrokPath start --config=ngrok.yml backend frontend

# Cleanup (will execute when ngrok is stopped)
Write-Host ""
Write-Host "Stopping services..." -ForegroundColor Yellow
Stop-Job $backendJob -ErrorAction SilentlyContinue
Remove-Job $backendJob -ErrorAction SilentlyContinue

Write-Host "Services stopped" -ForegroundColor Green
