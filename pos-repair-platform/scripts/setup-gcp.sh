#!/bin/bash

# GCP Setup Script for POS Repair Platform
# This script helps set up GCP resources for deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-}"
REGION="${GCP_REGION:-us-central1}"
ZONE="${GCP_ZONE:-us-central1-a}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed.${NC}"
    echo "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if project ID is set
if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}GCP_PROJECT_ID not set. Please enter your project ID:${NC}"
    read -r PROJECT_ID
fi

echo -e "${GREEN}Setting up GCP resources for project: $PROJECT_ID${NC}"

# Set project
gcloud config set project "$PROJECT_ID"

# Enable required APIs
echo -e "${GREEN}Enabling required GCP APIs...${NC}"
gcloud services enable \
    redis.googleapis.com \
    sqladmin.googleapis.com \
    run.googleapis.com \
    container.googleapis.com \
    cloudbuild.googleapis.com \
    vpcaccess.googleapis.com

# Create Memorystore Redis instance
echo -e "${GREEN}Creating Memorystore Redis instance...${NC}"
read -p "Enter Redis instance ID (default: pos-repair-redis): " INSTANCE_ID
INSTANCE_ID=${INSTANCE_ID:-pos-repair-redis}

read -p "Enter Redis memory size in GB (default: 1): " MEMORY_SIZE
MEMORY_SIZE=${MEMORY_SIZE:-1}

gcloud redis instances create "$INSTANCE_ID" \
    --size="$MEMORY_SIZE" \
    --region="$REGION" \
    --redis-version=redis_7_0 \
    --tier=basic \
    --project="$PROJECT_ID" || echo -e "${YELLOW}Redis instance may already exist${NC}"

# Get Redis IP
REDIS_IP=$(gcloud redis instances describe "$INSTANCE_ID" \
    --region="$REGION" \
    --format="value(host)")

echo -e "${GREEN}Redis IP: $REDIS_IP${NC}"

# Create Cloud SQL instance
echo -e "${GREEN}Creating Cloud SQL PostgreSQL instance...${NC}"
read -p "Enter SQL instance name (default: pos-repair-postgres): " SQL_INSTANCE
SQL_INSTANCE=${SQL_INSTANCE:-pos-repair-postgres}

read -p "Enter root password: " -s ROOT_PASSWORD
echo

gcloud sql instances create "$SQL_INSTANCE" \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region="$REGION" \
    --root-password="$ROOT_PASSWORD" \
    --storage-type=SSD \
    --storage-size=10GB \
    --backup-start-time=03:00 \
    --enable-bin-log || echo -e "${YELLOW}SQL instance may already exist${NC}"

# Create database
echo -e "${GREEN}Creating database...${NC}"
gcloud sql databases create pos_repair_platform \
    --instance="$SQL_INSTANCE" || echo -e "${YELLOW}Database may already exist${NC}"

# Create database user
echo -e "${GREEN}Creating database user...${NC}"
read -p "Enter database user name (default: posrepair_user): " DB_USER
DB_USER=${DB_USER:-posrepair_user}

read -p "Enter database user password: " -s DB_PASSWORD
echo

gcloud sql users create "$DB_USER" \
    --instance="$SQL_INSTANCE" \
    --password="$DB_PASSWORD" || echo -e "${YELLOW}User may already exist${NC}"

# Get connection name
CONNECTION_NAME=$(gcloud sql instances describe "$SQL_INSTANCE" \
    --format="value(connectionName)")

echo -e "${GREEN}Connection Name: $CONNECTION_NAME${NC}"

# Create VPC connector for Cloud Run
echo -e "${GREEN}Creating VPC connector...${NC}"
gcloud compute networks vpc-access connectors create pos-repair-connector \
    --region="$REGION" \
    --subnet-project="$PROJECT_ID" \
    --subnet=default \
    --min-instances=2 \
    --max-instances=3 \
    --machine-type=e2-micro || echo -e "${YELLOW}VPC connector may already exist${NC}"

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Redis IP: $REDIS_IP"
echo "SQL Connection: $CONNECTION_NAME"
echo ""
echo "Next steps:"
echo "1. Update k8s/redis-config.yaml with Redis IP: $REDIS_IP"
echo "2. Update deployment files with connection name: $CONNECTION_NAME"
echo "3. Build and push Docker images"
echo "4. Deploy to Cloud Run or GKE"
echo ""

