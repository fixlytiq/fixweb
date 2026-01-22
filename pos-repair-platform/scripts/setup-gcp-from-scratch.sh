#!/bin/bash

# GCP Complete Setup Script - From Scratch
# This script sets up a complete GCP environment with CI/CD ready configuration
# 
# Usage:
#   export GCP_PROJECT_ID="your-project-id"
#   export GCP_REGION="us-central1"
#   ./scripts/setup-gcp-from-scratch.sh
#
# Or run interactively:
#   ./scripts/setup-gcp-from-scratch.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-}"
REGION="${GCP_REGION:-us-central1}"
ZONE="${GCP_ZONE:-us-central1-a}"

# Resource names
REDIS_INSTANCE="${REDIS_INSTANCE:-pos-repair-redis}"
SQL_INSTANCE="${SQL_INSTANCE:-pos-repair-postgres}"
SQL_DATABASE="${SQL_DATABASE:-pos_repair_platform}"
SQL_USER="${SQL_USER:-posrepair_user}"
VPC_CONNECTOR="${VPC_CONNECTOR:-pos-repair-connector}"
ARTIFACT_REPO="${ARTIFACT_REPO:-pos-repair-images}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}GCP Complete Setup - From Scratch${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed.${NC}"
    echo "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if project ID is set
if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}GCP_PROJECT_ID not set.${NC}"
    echo -e "${YELLOW}Enter your GCP project ID (or 'new' to create one):${NC}"
    read -r PROJECT_ID
    
    if [ "$PROJECT_ID" = "new" ]; then
        echo -e "${YELLOW}Enter a new project ID (must be globally unique):${NC}"
        read -r NEW_PROJECT_ID
        echo -e "${YELLOW}Enter billing account ID (get from: gcloud billing accounts list):${NC}"
        read -r BILLING_ACCOUNT
        
        echo -e "${GREEN}Creating new project: $NEW_PROJECT_ID${NC}"
        gcloud projects create "$NEW_PROJECT_ID" --name="POS Repair Platform"
        gcloud billing projects link "$NEW_PROJECT_ID" --billing-account="$BILLING_ACCOUNT"
        PROJECT_ID="$NEW_PROJECT_ID"
    fi
fi

echo -e "${GREEN}Using project: $PROJECT_ID${NC}"
gcloud config set project "$PROJECT_ID"

# Get project number
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
echo -e "${GREEN}Project Number: $PROJECT_NUMBER${NC}"
echo ""

# Step 1: Enable required APIs
echo -e "${BLUE}Step 1: Enabling required GCP APIs...${NC}"
gcloud services enable \
    redis.googleapis.com \
    sqladmin.googleapis.com \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    artifactregistry.googleapis.com \
    vpcaccess.googleapis.com \
    servicenetworking.googleapis.com \
    compute.googleapis.com \
    --project="$PROJECT_ID"

echo -e "${GREEN}✓ APIs enabled${NC}"
echo ""

# Step 2: Grant Cloud Build permissions
echo -e "${BLUE}Step 2: Granting Cloud Build permissions...${NC}"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin" \
  --condition=None

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser" \
  --condition=None

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/artifactregistry.writer" \
  --condition=None

echo -e "${GREEN}✓ Permissions granted${NC}"
echo ""

# Step 3: Create Artifact Registry
echo -e "${BLUE}Step 3: Creating Artifact Registry...${NC}"
if gcloud artifacts repositories describe "$ARTIFACT_REPO" --location="$REGION" --project="$PROJECT_ID" &>/dev/null; then
    echo -e "${YELLOW}Artifact Registry already exists${NC}"
else
    gcloud artifacts repositories create "$ARTIFACT_REPO" \
        --repository-format=docker \
        --location="$REGION" \
        --description="Docker images for POS Repair Platform" \
        --project="$PROJECT_ID"
    echo -e "${GREEN}✓ Artifact Registry created${NC}"
fi
echo ""

# Step 4: Create VPC Connector
echo -e "${BLUE}Step 4: Creating VPC Connector...${NC}"
if gcloud compute networks vpc-access connectors describe "$VPC_CONNECTOR" --region="$REGION" --project="$PROJECT_ID" &>/dev/null; then
    echo -e "${YELLOW}VPC Connector already exists${NC}"
else
    gcloud compute networks vpc-access connectors create "$VPC_CONNECTOR" \
        --region="$REGION" \
        --subnet-project="$PROJECT_ID" \
        --subnet=default \
        --min-instances=2 \
        --max-instances=3 \
        --machine-type=e2-micro \
        --project="$PROJECT_ID"
    echo -e "${GREEN}✓ VPC Connector created${NC}"
fi
echo ""

# Step 5: Create Memorystore Redis instance
echo -e "${BLUE}Step 5: Creating Memorystore Redis instance...${NC}"
if gcloud redis instances describe "$REDIS_INSTANCE" --region="$REGION" --project="$PROJECT_ID" &>/dev/null; then
    echo -e "${YELLOW}Redis instance already exists${NC}"
    REDIS_IP=$(gcloud redis instances describe "$REDIS_INSTANCE" \
        --region="$REGION" \
        --format="value(host)" \
        --project="$PROJECT_ID")
else
    echo -e "${YELLOW}Creating Redis instance (this may take 5-10 minutes)...${NC}"
    gcloud redis instances create "$REDIS_INSTANCE" \
        --size=1 \
        --region="$REGION" \
        --redis-version=redis_7_0 \
        --tier=basic \
        --project="$PROJECT_ID"
    
    REDIS_IP=$(gcloud redis instances describe "$REDIS_INSTANCE" \
        --region="$REGION" \
        --format="value(host)" \
        --project="$PROJECT_ID")
    echo -e "${GREEN}✓ Redis instance created${NC}"
fi
echo -e "${GREEN}Redis IP: $REDIS_IP${NC}"
echo ""

# Step 6: Create Cloud SQL instance
ROOT_PASSWORD=""
echo -e "${BLUE}Step 6: Creating Cloud SQL PostgreSQL instance...${NC}"
if gcloud sql instances describe "$SQL_INSTANCE" --project="$PROJECT_ID" &>/dev/null; then
    echo -e "${YELLOW}SQL instance already exists${NC}"
    CONNECTION_NAME=$(gcloud sql instances describe "$SQL_INSTANCE" \
        --format="value(connectionName)" \
        --project="$PROJECT_ID")
else
    echo -e "${YELLOW}Enter root password for PostgreSQL:${NC}"
    read -s ROOT_PASSWORD
    echo ""
    
    echo -e "${YELLOW}Creating SQL instance (this may take 5-10 minutes)...${NC}"
    gcloud sql instances create "$SQL_INSTANCE" \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region="$REGION" \
        --root-password="$ROOT_PASSWORD" \
        --storage-type=SSD \
        --storage-size=10GB \
        --backup-start-time=03:00 \
        --enable-bin-log \
        --project="$PROJECT_ID"
    
    CONNECTION_NAME=$(gcloud sql instances describe "$SQL_INSTANCE" \
        --format="value(connectionName)" \
        --project="$PROJECT_ID")
    echo -e "${GREEN}✓ SQL instance created${NC}"
fi

# Create database
echo -e "${BLUE}Creating database...${NC}"
gcloud sql databases create "$SQL_DATABASE" \
    --instance="$SQL_INSTANCE" \
    --project="$PROJECT_ID" 2>/dev/null || echo -e "${YELLOW}Database may already exist${NC}"

# Create database user
if gcloud sql users list --instance="$SQL_INSTANCE" --project="$PROJECT_ID" --format="value(name)" | grep -q "^${SQL_USER}$"; then
    echo -e "${YELLOW}Database user already exists${NC}"
    echo -e "${YELLOW}Enter password for existing user '$SQL_USER' (or press Enter to skip):${NC}"
    read -s DB_PASSWORD
    if [ -n "$DB_PASSWORD" ]; then
        gcloud sql users set-password "$SQL_USER" \
            --instance="$SQL_INSTANCE" \
            --password="$DB_PASSWORD" \
            --project="$PROJECT_ID"
    fi
else
    echo -e "${YELLOW}Enter password for database user '$SQL_USER':${NC}"
    read -s DB_PASSWORD
    echo ""
    gcloud sql users create "$SQL_USER" \
        --instance="$SQL_INSTANCE" \
        --password="$DB_PASSWORD" \
        --project="$PROJECT_ID"
    echo -e "${GREEN}✓ Database user created${NC}"
fi

echo -e "${GREEN}Connection Name: $CONNECTION_NAME${NC}"
echo ""

# Step 7: Generate secrets
echo -e "${BLUE}Step 7: Generating secrets...${NC}"
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_urlsafe(32))" 2>/dev/null || echo "change-this-secret-key-in-production")
echo -e "${GREEN}✓ JWT secret generated${NC}"
echo ""

# Step 8: Update .gcp-config file
echo -e "${BLUE}Step 8: Updating .gcp-config file...${NC}"
cat > .gcp-config << EOF
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
EOF

echo -e "${GREEN}✓ .gcp-config updated${NC}"
echo ""

# Step 9: Summary and next steps
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Configuration saved to .gcp-config${NC}"
echo ""
echo -e "${YELLOW}Next: Connect GitHub and enable push-to-deploy${NC}"
echo "   See DEPLOY.md for:"
echo "   - Connecting your GitHub repo to Cloud Build"
echo "   - Creating a build trigger (use substitution vars from .gcp-config)"
echo "   - Pushing to main → automatic deploy to Cloud Run"
echo ""
echo -e "${GREEN}Your Cloud Run URLs (after first deploy):${NC}"
echo "   API: https://pos-repair-api-$PROJECT_NUMBER.$REGION.run.app"
echo "   Web: https://pos-repair-web-$PROJECT_NUMBER.$REGION.run.app"
echo ""
