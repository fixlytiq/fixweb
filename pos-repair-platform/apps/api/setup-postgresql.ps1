# PostgreSQL Integration Setup Script
# This script will help you integrate PostgreSQL with your NestJS API

param(
    [switch]$SkipDatabaseCreation,
    [switch]$SkipMigrations
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PostgreSQL Integration Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found!" -ForegroundColor Red
    Write-Host "Please run this script from the apps/api directory" -ForegroundColor Yellow
    exit 1
}

# Step 1: Get PostgreSQL credentials
Write-Host "Step 1: PostgreSQL Connection Configuration" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Gray
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

Write-Host ""
Write-Host "✓ Configuration collected" -ForegroundColor Green
Write-Host ""

# Step 2: Generate JWT Secret
Write-Host "Step 2: JWT Secret Configuration" -ForegroundColor Yellow
Write-Host "---------------------------------" -ForegroundColor Gray
Write-Host ""

$useCustomJWT = Read-Host "Use custom JWT secret? (y/N)"
if ($useCustomJWT -eq "y" -or $useCustomJWT -eq "Y") {
    $jwtSecret = Read-Host "Enter JWT secret (minimum 32 characters)"
    if ($jwtSecret.Length -lt 32) {
        Write-Host "⚠ Warning: JWT secret should be at least 32 characters" -ForegroundColor Yellow
        $continue = Read-Host "Continue anyway? (y/N)"
        if ($continue -ne "y" -and $continue -ne "Y") {
            exit 1
        }
    }
} else {
    # Generate a random 32-character secret
    $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    $jwtSecret = -join ((1..40) | ForEach-Object { Get-Random -Maximum $chars.Length | ForEach-Object { $chars[$_] } })
    Write-Host "✓ Generated secure JWT secret" -ForegroundColor Green
}

Write-Host ""

# Step 3: Test PostgreSQL Connection
Write-Host "Step 3: Testing PostgreSQL Connection" -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Gray
Write-Host ""

try {
    $testConnection = Test-NetConnection -ComputerName localhost -Port $dbPort -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    if ($testConnection.TcpTestSucceeded) {
        Write-Host "✓ PostgreSQL is running on port $dbPort" -ForegroundColor Green
    } else {
        Write-Host "⚠ PostgreSQL may not be running on port $dbPort" -ForegroundColor Yellow
        Write-Host "  Checking if PostgreSQL service is installed..." -ForegroundColor Yellow
        
        $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
        if ($pgService) {
            Write-Host "  Found PostgreSQL service: $($pgService.Name)" -ForegroundColor Cyan
            if ($pgService.Status -ne "Running") {
                Write-Host "  PostgreSQL service is not running. Attempting to start..." -ForegroundColor Yellow
                try {
                    Start-Service -Name $pgService.Name -ErrorAction Stop
                    Write-Host "  ✓ PostgreSQL service started" -ForegroundColor Green
                } catch {
                    Write-Host "  ❌ Failed to start PostgreSQL service: $_" -ForegroundColor Red
                    Write-Host "  Please start PostgreSQL manually and run this script again" -ForegroundColor Yellow
                    exit 1
                }
            }
        } else {
            Write-Host "  ⚠ Could not find PostgreSQL service" -ForegroundColor Yellow
            Write-Host "  Please ensure PostgreSQL is installed and running" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "⚠ Could not test PostgreSQL connection" -ForegroundColor Yellow
}

Write-Host ""

# Step 4: Create Database
if (-not $SkipDatabaseCreation) {
    Write-Host "Step 4: Creating Database" -ForegroundColor Yellow
    Write-Host "--------------------------" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "Attempting to create database '$dbName'..." -ForegroundColor Cyan
    
    # Try to create database using psql
    $env:PGPASSWORD = $dbPasswordPlain
    $createDbCommand = "CREATE DATABASE $dbName;"
    
    try {
        $result = & psql -U $dbUser -h localhost -p $dbPort -d postgres -c $createDbCommand 2>&1
        
        if ($LASTEXITCODE -eq 0 -or $result -match "already exists" -or $result -match "CREATE DATABASE") {
            Write-Host "✓ Database '$dbName' created or already exists" -ForegroundColor Green
        } else {
            Write-Host "⚠ Could not create database automatically" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Please create the database manually:" -ForegroundColor Cyan
            Write-Host "  1. Open psql: psql -U $dbUser" -ForegroundColor White
            Write-Host "  2. Run: CREATE DATABASE $dbName;" -ForegroundColor White
            Write-Host "  3. Exit: \q" -ForegroundColor White
            Write-Host ""
            $continue = Read-Host "Have you created the database? (Y/n)"
            if ($continue -eq "n" -or $continue -eq "N") {
                Write-Host "Exiting. Please create the database and run this script again." -ForegroundColor Yellow
                exit 1
            }
        }
    } catch {
        Write-Host "⚠ psql command not found in PATH" -ForegroundColor Yellow
        Write-Host "  Please create the database manually using pgAdmin or psql:" -ForegroundColor Cyan
        Write-Host "  CREATE DATABASE $dbName;" -ForegroundColor White
        Write-Host ""
        $continue = Read-Host "Have you created the database? (Y/n)"
        if ($continue -eq "n" -or $continue -eq "N") {
            exit 1
        }
    } finally {
        Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "Step 4: Skipping database creation (--SkipDatabaseCreation)" -ForegroundColor Yellow
}

Write-Host ""

# Step 5: Create .env file
Write-Host "Step 5: Creating .env File" -ForegroundColor Yellow
Write-Host "---------------------------" -ForegroundColor Gray
Write-Host ""

$envFile = ".env"
if (Test-Path $envFile) {
    Write-Host "⚠ .env file already exists" -ForegroundColor Yellow
    $backup = Read-Host "Backup existing .env file? (Y/n)"
    if ($backup -ne "n" -and $backup -ne "N") {
        $backupFile = ".env.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        Copy-Item $envFile $backupFile
        Write-Host "✓ Backed up to $backupFile" -ForegroundColor Green
    }
}

$databaseUrl = "postgresql://${dbUser}:${dbPasswordPlain}@localhost:${dbPort}/${dbName}?schema=public"

$envContent = @"
# Database Configuration
DATABASE_URL="$databaseUrl"

# JWT Configuration
JWT_SECRET="$jwtSecret"
JWT_EXPIRES_IN="7d"

# Port Configuration (optional)
PORT=3000
"@

$envContent | Out-File -FilePath $envFile -Encoding utf8 -NoNewline
Write-Host "✓ .env file created successfully" -ForegroundColor Green
Write-Host "  Location: $(Resolve-Path $envFile)" -ForegroundColor Gray
Write-Host ""

# Step 6: Install dependencies (if needed)
Write-Host "Step 6: Checking Dependencies" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Gray
Write-Host ""

if (-not (Test-Path "node_modules")) {
    Write-Host "⚠ node_modules not found. Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✓ Dependencies already installed" -ForegroundColor Green
}

Write-Host ""

# Step 7: Generate Prisma Client
Write-Host "Step 7: Generating Prisma Client" -ForegroundColor Yellow
Write-Host "--------------------------------" -ForegroundColor Gray
Write-Host ""

try {
    Write-Host "Running: npx prisma generate" -ForegroundColor Cyan
    npx prisma generate
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Prisma Client generated successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to generate Prisma Client" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error generating Prisma Client: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 8: Run Migrations
if (-not $SkipMigrations) {
    Write-Host "Step 8: Running Database Migrations" -ForegroundColor Yellow
    Write-Host "-----------------------------------" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "This will create all tables in your database." -ForegroundColor Cyan
    $confirm = Read-Host "Continue with migrations? (Y/n)"
    
    if ($confirm -eq "n" -or $confirm -eq "N") {
        Write-Host "Skipping migrations. Run manually with: npx prisma migrate dev --name init" -ForegroundColor Yellow
    } else {
        try {
            Write-Host "Running: npx prisma migrate dev --name init" -ForegroundColor Cyan
            Write-Host ""
            npx prisma migrate dev --name init
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "✓ Migrations completed successfully" -ForegroundColor Green
            } else {
                Write-Host "❌ Migrations failed. Please check the error above." -ForegroundColor Red
                exit 1
            }
        } catch {
            Write-Host "❌ Error running migrations: $_" -ForegroundColor Red
            Write-Host "You can run migrations manually with: npx prisma migrate dev --name init" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "Step 8: Skipping migrations (--SkipMigrations)" -ForegroundColor Yellow
}

Write-Host ""

# Step 9: Test Database Connection
Write-Host "Step 9: Testing Database Connection" -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor Gray
Write-Host ""

Write-Host "Testing Prisma connection..." -ForegroundColor Cyan
try {
    $testScript = @"
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.\`$connect\`()
  .then(() => {
    console.log('✓ Database connection successful');
    process.exit(0);
  })
  .catch((e) => {
    console.error('❌ Database connection failed:', e.message);
    process.exit(1);
  });
"@
    
    $testScript | Out-File -FilePath "test-connection.mjs" -Encoding utf8
    
    node test-connection.mjs
    
    Remove-Item "test-connection.mjs" -ErrorAction SilentlyContinue
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database connection test passed" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠ Could not test connection automatically" -ForegroundColor Yellow
    Write-Host "  You can test it by starting the API: npm run start:dev" -ForegroundColor Cyan
}

Write-Host ""

# Final Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete! ✅" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration Summary:" -ForegroundColor Yellow
Write-Host "  Database: $dbName" -ForegroundColor White
Write-Host "  User: $dbUser" -ForegroundColor White
Write-Host "  Port: $dbPort" -ForegroundColor White
Write-Host "  Connection String: postgresql://${dbUser}:***@localhost:${dbPort}/${dbName}" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Start the API: npm run start:dev" -ForegroundColor Cyan
Write-Host "  2. Test registration: POST http://localhost:3000/auth/register" -ForegroundColor Cyan
Write-Host "  3. View database: npx prisma studio" -ForegroundColor Cyan
Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Yellow
Write-Host "  • View database: npx prisma studio" -ForegroundColor Gray
Write-Host "  • Generate Prisma Client: npx prisma generate" -ForegroundColor Gray
Write-Host "  • Create migration: npx prisma migrate dev --name migration_name" -ForegroundColor Gray
Write-Host "  • Check migrations: npx prisma migrate status" -ForegroundColor Gray
Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Green
Write-Host ""

