# Check Cloud SQL Status and Complete Setup
# Run this script to check if Cloud SQL is ready and complete the setup

$PROJECT_ID = "repair-pos-485101"
$SQL_INSTANCE = "pos-repair-postgres"
$SQL_DATABASE = "pos_repair_platform"
$SQL_USER = "posrepair_user"
$DB_PASSWORD = "yDk428pJlBToNjZV"

Write-Host "`n=== Checking Cloud SQL Status ===" -ForegroundColor Cyan

# Check if instance exists and get status
$instance = gcloud sql instances list --project=$PROJECT_ID --format="json" | ConvertFrom-Json

if ($instance.Count -eq 0) {
    Write-Host "❌ Cloud SQL instance '$SQL_INSTANCE' not found!" -ForegroundColor Red
    Write-Host "`nCreating instance..." -ForegroundColor Yellow
    gcloud sql instances create $SQL_INSTANCE `
        --project=$PROJECT_ID `
        --database-version=POSTGRES_15 `
        --tier=db-f1-micro `
        --region=us-central1 `
        --root-password=IJqto0dv3AjxRHKL `
        --network=projects/$PROJECT_ID/global/networks/pos-repair-network `
        --no-assign-ip
    
    Write-Host "`nInstance creation started. This takes 5-10 minutes." -ForegroundColor Yellow
    Write-Host "Run this script again in a few minutes to check status." -ForegroundColor Cyan
    exit
}

$state = $instance[0].state
Write-Host "Instance State: $state" -ForegroundColor $(if ($state -eq "RUNNABLE") { "Green" } else { "Yellow" })

if ($state -ne "RUNNABLE") {
    Write-Host "`n⏳ Instance is still being created. Current state: $state" -ForegroundColor Yellow
    Write-Host "Please wait and run this script again in a few minutes." -ForegroundColor Cyan
    exit
}

Write-Host "`n✓ Cloud SQL is RUNNABLE!" -ForegroundColor Green
Write-Host "`n=== Completing Setup ===" -ForegroundColor Cyan

# Check if database exists
Write-Host "`nChecking if database exists..." -ForegroundColor Yellow
$databases = gcloud sql databases list --instance=$SQL_INSTANCE --project=$PROJECT_ID --format="value(name)" 2>&1

if ($databases -match $SQL_DATABASE) {
    Write-Host "✓ Database '$SQL_DATABASE' already exists" -ForegroundColor Green
} else {
    Write-Host "Creating database '$SQL_DATABASE'..." -ForegroundColor Yellow
    gcloud sql databases create $SQL_DATABASE --instance=$SQL_INSTANCE --project=$PROJECT_ID 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database created successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create database" -ForegroundColor Red
        exit 1
    }
}

# Check if user exists
Write-Host "`nChecking if user exists..." -ForegroundColor Yellow
$users = gcloud sql users list --instance=$SQL_INSTANCE --project=$PROJECT_ID --format="value(name)" 2>&1

if ($users -match $SQL_USER) {
    Write-Host "✓ User '$SQL_USER' already exists" -ForegroundColor Green
    Write-Host "Updating password..." -ForegroundColor Yellow
    gcloud sql users set-password $SQL_USER --instance=$SQL_INSTANCE --password=$DB_PASSWORD --project=$PROJECT_ID 2>&1 | Out-Null
    Write-Host "✓ Password updated" -ForegroundColor Green
} else {
    Write-Host "Creating user '$SQL_USER'..." -ForegroundColor Yellow
    gcloud sql users create $SQL_USER --instance=$SQL_INSTANCE --password=$DB_PASSWORD --project=$PROJECT_ID 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ User created successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create user" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n=== Setup Complete! ===" -ForegroundColor Green
Write-Host "`nCloud SQL is ready for deployment:" -ForegroundColor Cyan
Write-Host "  Instance: $SQL_INSTANCE" -ForegroundColor White
Write-Host "  Database: $SQL_DATABASE" -ForegroundColor White
Write-Host "  User: $SQL_USER" -ForegroundColor White
Write-Host "`nYou can now trigger a deployment!" -ForegroundColor Yellow
