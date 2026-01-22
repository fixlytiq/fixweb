# GCP Complete Setup Script - PowerShell Version for Windows
# This script sets up a complete GCP environment with CI/CD ready configuration
#
# Usage:
#   .\scripts\setup-gcp-from-scratch.ps1
#
# Or with environment variables:
#   $env:GCP_PROJECT_ID="your-project-id"
#   $env:GCP_REGION="us-central1"
#   .\scripts\setup-gcp-from-scratch.ps1

$ErrorActionPreference = "Stop"

# Configuration
$PROJECT_ID = if ($env:GCP_PROJECT_ID) { $env:GCP_PROJECT_ID } else { "" }
$REGION = if ($env:GCP_REGION) { $env:GCP_REGION } else { "us-central1" }
$ZONE = if ($env:GCP_ZONE) { $env:GCP_ZONE } else { "us-central1-a" }

# Resource names
$REDIS_INSTANCE = if ($env:REDIS_INSTANCE) { $env:REDIS_INSTANCE } else { "pos-repair-redis" }
$SQL_INSTANCE = if ($env:SQL_INSTANCE) { $env:SQL_INSTANCE } else { "pos-repair-postgres" }
$SQL_DATABASE = if ($env:SQL_DATABASE) { $env:SQL_DATABASE } else { "pos_repair_platform" }
$SQL_USER = if ($env:SQL_USER) { $env:SQL_USER } else { "posrepair_user" }
$VPC_CONNECTOR = if ($env:VPC_CONNECTOR) { $env:VPC_CONNECTOR } else { "pos-repair-connector" }
$ARTIFACT_REPO = if ($env:ARTIFACT_REPO) { $env:ARTIFACT_REPO } else { "pos-repair-images" }

Write-Host "========================================" -ForegroundColor Blue
Write-Host "GCP Complete Setup - From Scratch" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

# Check if gcloud is installed
try {
    $null = gcloud --version 2>&1
} catch {
    Write-Host "Error: gcloud CLI is not installed." -ForegroundColor Red
    Write-Host "Install it from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Red
    exit 1
}

# Check if project ID is set
if ([string]::IsNullOrWhiteSpace($PROJECT_ID)) {
    Write-Host "GCP_PROJECT_ID not set." -ForegroundColor Yellow
    Write-Host "Enter your GCP project ID (or 'new' to create one):" -ForegroundColor Yellow
    $PROJECT_ID = Read-Host
    
    if ($PROJECT_ID -eq "new") {
        Write-Host "Enter a new project ID (must be globally unique):" -ForegroundColor Yellow
        $NEW_PROJECT_ID = Read-Host
        Write-Host "Enter billing account ID (get from: gcloud billing accounts list):" -ForegroundColor Yellow
        $BILLING_ACCOUNT = Read-Host
        
        Write-Host "Creating new project: $NEW_PROJECT_ID" -ForegroundColor Green
        gcloud projects create $NEW_PROJECT_ID --name="POS Repair Platform"
        gcloud billing projects link $NEW_PROJECT_ID --billing-account=$BILLING_ACCOUNT
        $PROJECT_ID = $NEW_PROJECT_ID
    }
}

Write-Host "Using project: $PROJECT_ID" -ForegroundColor Green
gcloud config set project $PROJECT_ID

# Get project number
$PROJECT_NUMBER = gcloud projects describe $PROJECT_ID --format='value(projectNumber)'
Write-Host "Project Number: $PROJECT_NUMBER" -ForegroundColor Green
Write-Host ""

# Step 1: Enable required APIs
Write-Host "Step 1: Enabling required GCP APIs..." -ForegroundColor Blue
gcloud services enable `
    redis.googleapis.com `
    sqladmin.googleapis.com `
    run.googleapis.com `
    cloudbuild.googleapis.com `
    artifactregistry.googleapis.com `
    vpcaccess.googleapis.com `
    servicenetworking.googleapis.com `
    compute.googleapis.com `
    --project=$PROJECT_ID

Write-Host "✓ APIs enabled" -ForegroundColor Green
Write-Host ""

# Step 2: Grant Cloud Build permissions
Write-Host "Step 2: Granting Cloud Build permissions..." -ForegroundColor Blue
gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" `
    --role="roles/run.admin" `
    --condition=None

gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" `
    --role="roles/iam.serviceAccountUser" `
    --condition=None

gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" `
    --role="roles/artifactregistry.writer" `
    --condition=None

Write-Host "✓ Permissions granted" -ForegroundColor Green
Write-Host ""

# Step 3: Create Artifact Registry
Write-Host "Step 3: Creating Artifact Registry..." -ForegroundColor Blue
try {
    $null = gcloud artifacts repositories describe $ARTIFACT_REPO --location=$REGION --project=$PROJECT_ID 2>&1
    Write-Host "Artifact Registry already exists" -ForegroundColor Yellow
} catch {
    gcloud artifacts repositories create $ARTIFACT_REPO `
        --repository-format=docker `
        --location=$REGION `
        --description="Docker images for POS Repair Platform" `
        --project=$PROJECT_ID
    Write-Host "✓ Artifact Registry created" -ForegroundColor Green
}
Write-Host ""

# Step 4: Create VPC Connector
Write-Host "Step 4: Creating VPC Connector..." -ForegroundColor Blue
try {
    $null = gcloud compute networks vpc-access connectors describe $VPC_CONNECTOR --region=$REGION --project=$PROJECT_ID 2>&1
    Write-Host "VPC Connector already exists" -ForegroundColor Yellow
} catch {
    gcloud compute networks vpc-access connectors create $VPC_CONNECTOR `
        --region=$REGION `
        --subnet-project=$PROJECT_ID `
        --subnet=default `
        --min-instances=2 `
        --max-instances=3 `
        --machine-type=e2-micro `
        --project=$PROJECT_ID
    Write-Host "✓ VPC Connector created" -ForegroundColor Green
}
Write-Host ""

# Step 5: Create Memorystore Redis instance
Write-Host "Step 5: Creating Memorystore Redis instance..." -ForegroundColor Blue
try {
    $REDIS_IP = gcloud redis instances describe $REDIS_INSTANCE --region=$REGION --format="value(host)" --project=$PROJECT_ID 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Redis instance already exists" -ForegroundColor Yellow
    } else {
        throw
    }
} catch {
    Write-Host "Creating Redis instance (this may take 5-10 minutes)..." -ForegroundColor Yellow
    gcloud redis instances create $REDIS_INSTANCE `
        --size=1 `
        --region=$REGION `
        --redis-version=redis_7_0 `
        --tier=basic `
        --project=$PROJECT_ID
    
    $REDIS_IP = gcloud redis instances describe $REDIS_INSTANCE --region=$REGION --format="value(host)" --project=$PROJECT_ID
    Write-Host "✓ Redis instance created" -ForegroundColor Green
}
Write-Host "Redis IP: $REDIS_IP" -ForegroundColor Green
Write-Host ""

# Step 6: Create Cloud SQL instance
$ROOT_PASSWORD = ""
Write-Host "Step 6: Creating Cloud SQL PostgreSQL instance..." -ForegroundColor Blue
try {
    $CONNECTION_NAME = gcloud sql instances describe $SQL_INSTANCE --format="value(connectionName)" --project=$PROJECT_ID 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SQL instance already exists" -ForegroundColor Yellow
    } else {
        throw
    }
} catch {
    $secureString = Read-Host "Enter root password for PostgreSQL" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureString)
    $ROOT_PASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    Write-Host ""
    
    Write-Host "Creating SQL instance (this may take 5-10 minutes)..." -ForegroundColor Yellow
    gcloud sql instances create $SQL_INSTANCE `
        --database-version=POSTGRES_15 `
        --tier=db-f1-micro `
        --region=$REGION `
        --root-password=$ROOT_PASSWORD `
        --storage-type=SSD `
        --storage-size=10GB `
        --backup-start-time=03:00 `
        --enable-bin-log `
        --project=$PROJECT_ID
    
    $CONNECTION_NAME = gcloud sql instances describe $SQL_INSTANCE --format="value(connectionName)" --project=$PROJECT_ID
    Write-Host "✓ SQL instance created" -ForegroundColor Green
}

# Create database
Write-Host "Creating database..." -ForegroundColor Blue
try {
    gcloud sql databases create $SQL_DATABASE --instance=$SQL_INSTANCE --project=$PROJECT_ID 2>&1 | Out-Null
} catch {
    Write-Host "Database may already exist" -ForegroundColor Yellow
}

# Create database user
$existingUsers = gcloud sql users list --instance=$SQL_INSTANCE --project=$PROJECT_ID --format="value(name)" 2>&1
if ($existingUsers -contains $SQL_USER) {
    Write-Host "Database user already exists" -ForegroundColor Yellow
    $secureString = Read-Host "Enter password for existing user '$SQL_USER' (or press Enter to skip)" -AsSecureString
    if ($secureString.Length -gt 0) {
        $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureString)
        $DB_PASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
        gcloud sql users set-password $SQL_USER --instance=$SQL_INSTANCE --password=$DB_PASSWORD --project=$PROJECT_ID
    }
} else {
    $secureString = Read-Host "Enter password for database user '$SQL_USER'" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureString)
    $DB_PASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    Write-Host ""
    gcloud sql users create $SQL_USER --instance=$SQL_INSTANCE --password=$DB_PASSWORD --project=$PROJECT_ID
    Write-Host "✓ Database user created" -ForegroundColor Green
}

Write-Host "Connection Name: $CONNECTION_NAME" -ForegroundColor Green
Write-Host ""

# Step 7: Generate secrets
Write-Host "Step 7: Generating secrets..." -ForegroundColor Blue
$JWT_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
Write-Host "✓ JWT secret generated" -ForegroundColor Green
Write-Host ""

# Step 8: Update .gcp-config file
Write-Host "Step 8: Updating .gcp-config file..." -ForegroundColor Blue
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
VPC_NETWORK=default
VPC_SUBNET=default

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
Write-Host "✓ .gcp-config updated" -ForegroundColor Green
Write-Host ""

# Step 9: Summary and next steps
Write-Host "========================================" -ForegroundColor Blue
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""
Write-Host "Configuration saved to .gcp-config" -ForegroundColor Green
Write-Host ""
Write-Host "Next: Connect GitHub and enable push-to-deploy" -ForegroundColor Yellow
Write-Host "   See GCP_SETUP_GUIDE.md for:"
Write-Host "   - Connecting your GitHub repo to Cloud Build"
Write-Host "   - Creating a build trigger (use substitution vars from .gcp-config)"
Write-Host "   - Pushing to main -> automatic deploy to Cloud Run"
Write-Host ""
Write-Host "Your Cloud Run URLs (after first deploy):" -ForegroundColor Green
Write-Host "   API: https://pos-repair-api-$PROJECT_NUMBER.$REGION.run.app"
Write-Host "   Web: https://pos-repair-web-$PROJECT_NUMBER.$REGION.run.app"
Write-Host ""
