# Run Prisma Migrations Script
# This script will generate Prisma Client and run migrations

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Prisma Migrations Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please create a .env file in the current directory with:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host 'DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"' -ForegroundColor White
    Write-Host 'JWT_SECRET="your-secret-key-minimum-32-characters"' -ForegroundColor White
    Write-Host 'JWT_EXPIRES_IN="7d"' -ForegroundColor White
    Write-Host ""
    Write-Host "Example:" -ForegroundColor Cyan
    Write-Host 'DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/pos_repair_db?schema=public"' -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host "✓ .env file found" -ForegroundColor Green
Write-Host ""

# Step 1: Generate Prisma Client
Write-Host "Step 1: Generating Prisma Client..." -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor Gray
Write-Host ""

try {
    npx prisma generate
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Prisma Client generated successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to generate Prisma Client" -ForegroundColor Red
        Write-Host "Please check your DATABASE_URL in .env file" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Run Migrations
Write-Host "Step 2: Running Database Migrations..." -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "This will create all tables in your database." -ForegroundColor Cyan
Write-Host ""

$confirm = Read-Host "Continue with migrations? (Y/n)"
if ($confirm -eq "n" -or $confirm -eq "N") {
    Write-Host "Migrations cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Running: npx prisma migrate dev --name init" -ForegroundColor Cyan
Write-Host ""

try {
    npx prisma migrate dev --name init
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Migrations completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "All database tables have been created." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "  1. Start the API: npm run start:dev" -ForegroundColor Cyan
        Write-Host "  2. View database: npx prisma studio" -ForegroundColor Cyan
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ Migrations failed" -ForegroundColor Red
        Write-Host "Please check the error messages above" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Common issues:" -ForegroundColor Yellow
        Write-Host "  - Database does not exist (create it first)" -ForegroundColor Gray
        Write-Host "  - Wrong credentials in DATABASE_URL" -ForegroundColor Gray
        Write-Host "  - PostgreSQL service not running" -ForegroundColor Gray
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error running migrations: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete! ✅" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

