# Start Next.js Frontend Server Script
# This script starts the Next.js frontend on port 3001

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Next.js Frontend Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to web directory
$webDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $webDir

Write-Host "Starting Next.js frontend on port 3001..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend URL: http://localhost:3001" -ForegroundColor Green
Write-Host "Backend URL:  http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠ node_modules not found. Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Start the server
npm run dev

