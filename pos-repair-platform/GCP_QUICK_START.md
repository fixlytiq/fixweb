# GCP Quick Start Checklist

Use this checklist to quickly set up your GCP deployment. For detailed instructions, see [GCP_SETUP_STEP_BY_STEP.md](./GCP_SETUP_STEP_BY_STEP.md).

## Pre-Flight Checklist

- [ ] GCP account created
- [ ] Billing enabled
- [ ] `gcloud` CLI installed
- [ ] Docker installed
- [ ] Terminal/Command line ready

## Quick Setup (15-20 minutes)

### 1. Install & Configure gcloud (5 min)

```bash
# Install (if not already installed)
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Login and set project
gcloud init
gcloud auth login
```

### 2. Set Variables (1 min)

```bash
export PROJECT_ID="your-project-id"
export REGION="us-central1"  # Choose closest region
gcloud config set project $PROJECT_ID
```

### 3. Enable APIs (2 min)

```bash
gcloud services enable \
    redis.googleapis.com \
    sqladmin.googleapis.com \
    run.googleapis.com \
    container.googleapis.com \
    cloudbuild.googleapis.com \
    vpcaccess.googleapis.com
```

### 4. Create Resources (10-15 min)

**Option A: Use Automated Script**

```bash
cd /home/omprakash/fixwebone/fixweb/pos-repair-platform
export GCP_PROJECT_ID=$PROJECT_ID
./scripts/setup-gcp.sh
```

**Option B: Manual Setup**

Follow the detailed steps in [GCP_SETUP_STEP_BY_STEP.md](./GCP_SETUP_STEP_BY_STEP.md)

### 5. Build & Push Images (5 min)

```bash
# Build API
docker build -t gcr.io/$PROJECT_ID/pos-repair-api:latest -f apps/api/Dockerfile .
docker push gcr.io/$PROJECT_ID/pos-repair-api:latest

# Build Web
docker build -t gcr.io/$PROJECT_ID/pos-repair-web:latest \
  -f apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com .
docker push gcr.io/$PROJECT_ID/pos-repair-web:latest
```

### 6. Deploy to Cloud Run (5 min)

```bash
# Get your Redis IP and Connection Name from Step 4
export REDIS_IP="10.x.x.x"  # From Memorystore
export CONNECTION_NAME="PROJECT:REGION:INSTANCE"  # From Cloud SQL
export DB_USER="posrepair_user"
export DB_PASSWORD="your-password"

# Deploy API
gcloud run deploy pos-repair-api \
  --image gcr.io/$PROJECT_ID/pos-repair-api:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --vpc-connector pos-repair-connector \
  --add-cloudsql-instances $CONNECTION_NAME \
  --set-env-vars "DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@/pos_repair_platform?host=/cloudsql/$CONNECTION_NAME,REDIS_HOST=$REDIS_IP,REDIS_PORT=6379" \
  --memory 512Mi

# Get API URL
export API_URL=$(gcloud run services describe pos-repair-api --region $REGION --format="value(status.url)")

# Deploy Web
gcloud run deploy pos-repair-web \
  --image gcr.io/$PROJECT_ID/pos-repair-web:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars "NEXT_PUBLIC_API_URL=$API_URL" \
  --memory 512Mi
```

### 7. Run Migrations (2 min)

```bash
cd apps/api
export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@YOUR_SQL_IP:5432/pos_repair_platform"
npx prisma migrate deploy
```

### 8. Verify (1 min)

```bash
# Get URLs
gcloud run services list --region $REGION

# Test
curl $(gcloud run services describe pos-repair-api --region $REGION --format="value(status.url)")
```

## Common Commands

```bash
# View logs
gcloud run services logs read pos-repair-api --region $REGION

# Update service
gcloud run services update pos-repair-api --image gcr.io/$PROJECT_ID/pos-repair-api:NEW_TAG

# Scale
gcloud run services update pos-repair-api --min-instances 2 --max-instances 10

# Delete (if needed)
gcloud run services delete pos-repair-api --region $REGION
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Permission denied | Enable billing, check APIs enabled |
| Can't connect to Redis | Verify VPC connector, check Redis IP |
| Database connection fails | Verify connection name, check Cloud SQL status |
| Images won't push | Run `gcloud auth configure-docker` |

## Next Steps

- [ ] Set up custom domain
- [ ] Configure SSL
- [ ] Set up monitoring
- [ ] Configure CI/CD
- [ ] Review costs

## Need Help?

- **Detailed Guide**: [GCP_SETUP_STEP_BY_STEP.md](./GCP_SETUP_STEP_BY_STEP.md)
- **Deployment Guide**: [GCP_DEPLOYMENT.md](./GCP_DEPLOYMENT.md)
- **Summary**: [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)

