# PowerShell script to start the POS Repair Platform with Docker

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "POS Repair Platform - Docker Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check if docker-compose is available
Write-Host "Checking Docker Compose..." -ForegroundColor Yellow
try {
    docker compose version | Out-Null
    Write-Host "✓ Docker Compose is available" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker Compose is not available." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Starting all services..." -ForegroundColor Yellow
Write-Host ""

# Start services
docker compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Services started successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Services:" -ForegroundColor Cyan
    Write-Host "  - API:        http://localhost:3000" -ForegroundColor White
    Write-Host "  - Web App:    http://localhost:3001" -ForegroundColor White
    Write-Host "  - Owner App:  http://localhost:3002" -ForegroundColor White
    Write-Host "  - PostgreSQL: localhost:5433" -ForegroundColor White
    Write-Host "  - Redis:      localhost:6380" -ForegroundColor White
    Write-Host ""
    Write-Host "View logs: docker compose logs -f" -ForegroundColor Yellow
    Write-Host "Stop services: docker compose down" -ForegroundColor Yellow
    Write-Host ""
    
    # Show logs
    Write-Host "Showing logs (Ctrl+C to exit)..."
    Write-Host ""
    docker compose logs -f
} else {
    Write-Host ""
    Write-Host "✗ Failed to start services. Check the errors above." -ForegroundColor Red
    exit 1
}

