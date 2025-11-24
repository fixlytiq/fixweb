#!/bin/bash

# Step 3: Enable Required APIs
# Run this after you've logged in and set your project

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Step 3: Enabling Required APIs${NC}"
echo ""

# Check if logged in
if ! gcloud auth list --format="value(account)" 2>/dev/null | grep -q .; then
    echo -e "${RED}❌ Not logged in. Please run:${NC}"
    echo "   gcloud auth login"
    exit 1
fi

# Check if project is set
PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "")
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "(unset)" ]; then
    echo -e "${YELLOW}⚠️  No project selected.${NC}"
    echo ""
    echo "Please set your project first:"
    echo "   export PROJECT_ID=\"your-project-id\""
    echo "   gcloud config set project \$PROJECT_ID"
    echo ""
    echo "Or create a new project:"
    echo "   export PROJECT_ID=\"pos-repair-platform-$(date +%s)\""
    echo "   gcloud projects create \$PROJECT_ID --name=\"POS Repair Platform\""
    echo "   gcloud config set project \$PROJECT_ID"
    exit 1
fi

echo -e "${GREEN}✓ Logged in as: $(gcloud auth list --format='value(account)' | head -1)${NC}"
echo -e "${GREEN}✓ Project: $PROJECT_ID${NC}"
echo ""

# Enable APIs
echo -e "${GREEN}Enabling required APIs...${NC}"
echo "This may take 1-2 minutes..."
echo ""

gcloud services enable \
    redis.googleapis.com \
    sqladmin.googleapis.com \
    run.googleapis.com \
    container.googleapis.com \
    cloudbuild.googleapis.com \
    vpcaccess.googleapis.com \
    compute.googleapis.com \
    --project=$PROJECT_ID

echo ""
echo -e "${GREEN}✅ All APIs enabled successfully!${NC}"
echo ""
echo "Next steps:"
echo "  1. Set region: export REGION=\"us-central1\""
echo "  2. Continue with Step 5: Create Memorystore Redis"
echo "  3. Or run full setup: ./scripts/setup-gcp.sh"
echo ""

