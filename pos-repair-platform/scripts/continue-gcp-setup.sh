#!/bin/bash

# Continue GCP Setup Script
# Run this after completing Step 2 (login and project creation)

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Continuing GCP Setup...${NC}"
echo ""

# Check if logged in
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}⚠️  You need to login first:${NC}"
    echo "   gcloud auth login"
    exit 1
fi

# Check if project is set
PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "")
if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}⚠️  No project selected. Please set your project:${NC}"
    echo "   export PROJECT_ID=\"your-project-id\""
    echo "   gcloud config set project \$PROJECT_ID"
    exit 1
fi

echo -e "${GREEN}✓ Logged in as: $(gcloud auth list --filter=status:ACTIVE --format='value(account)')${NC}"
echo -e "${GREEN}✓ Current project: $PROJECT_ID${NC}"
echo ""

# Step 3: Enable APIs
echo -e "${GREEN}Step 3: Enabling required APIs...${NC}"
gcloud services enable \
    redis.googleapis.com \
    sqladmin.googleapis.com \
    run.googleapis.com \
    container.googleapis.com \
    cloudbuild.googleapis.com \
    vpcaccess.googleapis.com \
    compute.googleapis.com \
    --project=$PROJECT_ID

echo -e "${GREEN}✓ APIs enabled${NC}"
echo ""

# Step 4: Set region
export REGION="${GCP_REGION:-us-central1}"
export ZONE="${REGION}-a"

echo -e "${GREEN}Step 4: Region configured${NC}"
echo "  Region: $REGION"
echo "  Zone: $ZONE"
echo ""

echo -e "${GREEN}✅ Steps 2-4 Complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Review: cat pos-repair-platform/GCP_SETUP_STEP_BY_STEP.md"
echo "  2. Continue with Step 5: Create Memorystore Redis"
echo "  3. Or run the automated setup: ./scripts/setup-gcp.sh"
echo ""

