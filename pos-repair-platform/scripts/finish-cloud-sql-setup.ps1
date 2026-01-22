# Complete Cloud SQL setup once instance is ready
$ErrorActionPreference = "Stop"

$PROJECT_ID = "repair-pos-485101"
$SQL_INSTANCE = "pos-repair-postgres"
$SQL_DATABASE = "pos_repair_platform"
$SQL_USER = "posrepair_user"
$DB_PASSWORD = "yDk428pJlBToNjZV"

Write-Host "Checking Cloud SQL status..." -ForegroundColor Blue
$state = gcloud sql instances describe $SQL_INSTANCE --project=$PROJECT_ID --format="value(state)" 2>&1

if ($LASTEXITCODE -ne 0 -or $state -ne "RUNNABLE") {
    Write-Host "Cloud SQL is not ready yet. State: $state" -ForegroundColor Yellow
    Write-Host "Please wait and run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host "Cloud SQL is ready! Completing setup..." -ForegroundColor Green
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

# Get connection name
$CONNECTION_NAME = gcloud sql instances describe $SQL_INSTANCE --project=$PROJECT_ID --format="value(connectionName)"
Write-Host ""
Write-Host "✓ Setup complete!" -ForegroundColor Green
Write-Host "Connection Name: $CONNECTION_NAME" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now proceed with GitHub connection and build trigger setup." -ForegroundColor Green
