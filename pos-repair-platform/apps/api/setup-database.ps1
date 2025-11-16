# PostgreSQL Database Setup Script for Windows
# Run this script from the apps/api directory

Write-Host "=== PostgreSQL Database Setup ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if .env file exists
Write-Host "Step 1: Checking for .env file..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host ".env file already exists. Backing up to .env.backup..." -ForegroundColor Yellow
    Copy-Item ".env" ".env.backup"
    Write-Host "✓ Backup created" -ForegroundColor Green
} else {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
}

# Step 2: Get PostgreSQL connection details
Write-Host ""
Write-Host "Step 2: Enter PostgreSQL connection details" -ForegroundColor Yellow
Write-Host ""

$dbUser = Read-Host "Enter PostgreSQL username (default: postgres)"
if ([string]::IsNullOrWhiteSpace($dbUser)) {
    $dbUser = "postgres"
}

$dbPassword = Read-Host "Enter PostgreSQL password" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
)

$dbPort = Read-Host "Enter PostgreSQL port (default: 5432)"
if ([string]::IsNullOrWhiteSpace($dbPort)) {
    $dbPort = "5432"
}

$dbName = Read-Host "Enter database name (default: pos_repair_db)"
if ([string]::IsNullOrWhiteSpace($dbName)) {
    $dbName = "pos_repair_db"
}

$jwtSecret = Read-Host "Enter JWT secret (or press Enter for auto-generated)"
if ([string]::IsNullOrWhiteSpace($jwtSecret)) {
    # Generate a random 32-character secret
    $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    $jwtSecret = -join ((1..32) | ForEach-Object { Get-Random -Maximum $chars.Length | ForEach-Object { $chars[$_] } })
    Write-Host "Generated JWT secret: $jwtSecret" -ForegroundColor Green
}

# Step 3: Create .env file
Write-Host ""
Write-Host "Step 3: Creating .env file..." -ForegroundColor Yellow

$envContent = @"
# Database Configuration
DATABASE_URL="postgresql://${dbUser}:${dbPasswordPlain}@localhost:${dbPort}/${dbName}?schema=public"

# JWT Configuration
JWT_SECRET="${jwtSecret}"
JWT_EXPIRES_IN="7d"

# Port Configuration (optional)
PORT=3000
"@

$envContent | Out-File -FilePath ".env" -Encoding utf8
Write-Host "✓ .env file created" -ForegroundColor Green

# Step 4: Check if PostgreSQL is running
Write-Host ""
Write-Host "Step 4: Checking PostgreSQL connection..." -ForegroundColor Yellow

try {
    $testConnection = Test-NetConnection -ComputerName localhost -Port $dbPort -WarningAction SilentlyContinue
    if ($testConnection.TcpTestSucceeded) {
        Write-Host "✓ PostgreSQL is running on port $dbPort" -ForegroundColor Green
    } else {
        Write-Host "⚠ PostgreSQL may not be running on port $dbPort" -ForegroundColor Yellow
        Write-Host "  Please start PostgreSQL service and try again" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Could not check PostgreSQL connection" -ForegroundColor Yellow
}

# Step 5: Instructions for database creation
Write-Host ""
Write-Host "Step 5: Database Setup Instructions" -ForegroundColor Yellow
Write-Host ""
Write-Host "You need to create the database manually. Run one of these commands:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: Using psql command line" -ForegroundColor White
Write-Host "  psql -U $dbUser -c `"CREATE DATABASE $dbName;`"" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 2: Using psql interactive" -ForegroundColor White
Write-Host "  psql -U $dbUser" -ForegroundColor Gray
Write-Host "  CREATE DATABASE $dbName;" -ForegroundColor Gray
Write-Host "  \q" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 3: Using pgAdmin (GUI)" -ForegroundColor White
Write-Host "  1. Open pgAdmin" -ForegroundColor Gray
Write-Host "  2. Right-click Databases → Create → Database" -ForegroundColor Gray
Write-Host "  3. Enter name: $dbName" -ForegroundColor Gray
Write-Host "  4. Click Save" -ForegroundColor Gray
Write-Host ""

# Step 6: Next steps
Write-Host "Step 6: After creating the database, run these commands:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  npx prisma generate" -ForegroundColor Cyan
Write-Host "  npx prisma migrate dev --name init" -ForegroundColor Cyan
Write-Host "  npm run start:dev" -ForegroundColor Cyan
Write-Host ""

Write-Host "=== Setup Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Your .env file has been created with:" -ForegroundColor Cyan
Write-Host "  Database: $dbName" -ForegroundColor White
Write-Host "  User: $dbUser" -ForegroundColor White
Write-Host "  Port: $dbPort" -ForegroundColor White
Write-Host ""

