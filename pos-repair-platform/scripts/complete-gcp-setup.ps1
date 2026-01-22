# Completion script for GCP setup
# Run this once Redis and Cloud SQL are ready

$ErrorActionPreference = "Stop"

$PROJECT_ID = "repair-pos-485101"
$PROJECT_NUMBER = "233232647471"
$REGION = "us-central1"
$ZONE = "us-central1-a"

# Resource names
$REDIS_INSTANCE = "pos-repair-redis"
$SQL_INSTANCE = "pos-repair-postgres"
$SQL_DATABASE = "pos_repair_platform"
$SQL_USER = "posrepair_user"
$VPC_CONNECTOR = "pos-repair-connector"
$ARTIFACT_REPO = "pos-repair-images"

# Passwords (from earlier setup)
$ROOT_PASSWORD = "IJqto0dv3AjxRHKL"
$DB_PASSWORD = "yDk428pJlBToNjZV"
$JWT_SECRET = "IWFKzVLkERlDJ0iX1caYCvpmqMBuxSfj"

Write-Host "Completing GCP Setup..." -ForegroundColor Blue
Write-Host ""

# Check Redis status
Write-Host "Checking Redis status..." -ForegroundColor Yellow
$redisState = gcloud redis instances describe $REDIS_INSTANCE --region=$REGION --project=$PROJECT_ID --format="value(state)" 2>&1
if ($redisState -eq "READY") {
    $REDIS_IP = gcloud redis instances describe $REDIS_INSTANCE --region=$REGION --project=$PROJECT_ID --format="value(host)"
    Write-Host "✓ Redis is ready. IP: $REDIS_IP" -ForegroundColor Green
} else {
    Write-Host "✗ Redis is not ready yet. State: $redisState" -ForegroundColor Red
    Write-Host "Please wait for Redis to be ready and run this script again." -ForegroundColor Yellow
    exit 1
}

# Check Cloud SQL status
Write-Host "Checking Cloud SQL status..." -ForegroundColor Yellow
try {
    $sqlState = gcloud sql instances describe $SQL_INSTANCE --project=$PROJECT_ID --format="value(state)" 2>&1
    if ($sqlState -eq "RUNNABLE") {
        $CONNECTION_NAME = gcloud sql instances describe $SQL_INSTANCE --project=$PROJECT_ID --format="value(connectionName)"
        Write-Host "✓ Cloud SQL is ready. Connection: $CONNECTION_NAME" -ForegroundColor Green
    } else {
        Write-Host "✗ Cloud SQL is not ready yet. State: $sqlState" -ForegroundColor Red
        Write-Host "Please wait for Cloud SQL to be ready and run this script again." -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "✗ Cloud SQL instance not found. Please wait for it to be created." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Create database
Write-Host "Creating database..." -ForegroundColor Blue
try {
    gcloud sql databases create $SQL_DATABASE --instance=$SQL_INSTANCE --project=$PROJECT_ID 2>&1 | Out-Null
    Write-Host "✓ Database created" -ForegroundColor Green
} catch {
    Write-Host "Database may already exist (this is OK)" -ForegroundColor Yellow
}

# Create database user
Write-Host "Creating database user..." -ForegroundColor Blue
$existingUsers = gcloud sql users list --instance=$SQL_INSTANCE --project=$PROJECT_ID --format="value(name)" 2>&1
if ($existingUsers -contains $SQL_USER) {
    Write-Host "User already exists, updating password..." -ForegroundColor Yellow
    gcloud sql users set-password $SQL_USER --instance=$SQL_INSTANCE --password=$DB_PASSWORD --project=$PROJECT_ID
    Write-Host "✓ User password updated" -ForegroundColor Green
} else {
    gcloud sql users create $SQL_USER --instance=$SQL_INSTANCE --password=$DB_PASSWORD --project=$PROJECT_ID
    Write-Host "✓ Database user created" -ForegroundColor Green
}

Write-Host ""

# Create .gcp-config file
Write-Host "Creating .gcp-config file..." -ForegroundColor Blue
$configContent = @"
# GCP Configuration - DO NOT COMMIT THIS FILE
# Generated during setup

PROJECT_ID=$PROJECT_ID
PROJECT_NUMBER=$PROJECT_NUMBER
REGION=$REGION
ZONE=$ZONE

# Redis (Memorystore)
REDIS_INSTANCE=$REDIS_INSTANCE
REDIS_IP=$REDIS_IP
REDIS_PORT=6379

# PostgreSQL (Cloud SQL)
SQL_INSTANCE=$SQL_INSTANCE
SQL_DATABASE=$SQL_DATABASE
SQL_USER=$SQL_USER
SQL_PASSWORD=$DB_PASSWORD
SQL_ROOT_PASSWORD=$ROOT_PASSWORD
CONNECTION_NAME=$CONNECTION_NAME

# VPC
VPC_CONNECTOR=$VPC_CONNECTOR
VPC_NETWORK=pos-repair-network
VPC_SUBNET=pos-repair-subnet

# Artifact Registry
ARTIFACT_REPO=$ARTIFACT_REPO
ARTIFACT_REGISTRY=us-central1-docker.pkg.dev/$PROJECT_ID/$ARTIFACT_REPO

# JWT (for Cloud Build substitution variables)
JWT_SECRET=$JWT_SECRET

# Cloud Run URLs (will be available after first deployment)
API_URL=https://pos-repair-api-$PROJECT_NUMBER.$REGION.run.app
WEB_URL=https://pos-repair-web-$PROJECT_NUMBER.$REGION.run.app
"@

$configContent | Out-File -FilePath ".gcp-config" -Encoding utf8 -NoNewline
Write-Host "✓ .gcp-config file created" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Blue
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""
Write-Host "Configuration saved to .gcp-config" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Connect GitHub repository to Cloud Build" -ForegroundColor White
Write-Host "2. Create build trigger with substitution variables" -ForegroundColor White
Write-Host "3. Push to main branch to deploy" -ForegroundColor White
Write-Host ""
Write-Host "See GCP_SETUP_GUIDE.md for detailed instructions" -ForegroundColor Cyan
Write-Host ""
