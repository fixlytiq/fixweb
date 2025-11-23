# Deployment Summary

This document provides a quick reference for deploying the POS Repair Platform to GCP.

## Quick Start

### 1. Prerequisites

- GCP account with billing enabled
- `gcloud` CLI installed and configured
- Docker installed
- Project ID set: `gcloud config set project YOUR_PROJECT_ID`

### 2. Run Setup Script

```bash
export GCP_PROJECT_ID="your-project-id"
export GCP_REGION="us-central1"
./scripts/setup-gcp.sh
```

This script will:
- Enable required GCP APIs
- Create Memorystore Redis instance
- Create Cloud SQL PostgreSQL instance
- Create VPC connector for Cloud Run
- Provide connection details

### 3. Update Configuration

After running the setup script, update:

- `k8s/redis-config.yaml`: Set Memorystore IP
- `k8s/api-deployment.yaml`: Set project ID
- `k8s/web-deployment.yaml`: Set project ID and API URL
- `cloudbuild.yaml`: Set project ID and API URL

### 4. Build and Push Images

```bash
# Set variables
export PROJECT_ID="your-project-id"

# Build and push API
docker build -t gcr.io/$PROJECT_ID/pos-repair-api:latest -f apps/api/Dockerfile .
docker push gcr.io/$PROJECT_ID/pos-repair-api:latest

# Build and push Web
docker build -t gcr.io/$PROJECT_ID/pos-repair-web:latest \
  -f apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com .
docker push gcr.io/$PROJECT_ID/pos-repair-web:latest
```

### 5. Deploy

#### Option A: Cloud Run

```bash
# Deploy API
gcloud run deploy pos-repair-api \
  --image gcr.io/$PROJECT_ID/pos-repair-api:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --vpc-connector pos-repair-connector \
  --set-env-vars "REDIS_HOST=YOUR_REDIS_IP,REDIS_PORT=6379" \
  --memory 512Mi

# Deploy Web
gcloud run deploy pos-repair-web \
  --image gcr.io/$PROJECT_ID/pos-repair-web:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NEXT_PUBLIC_API_URL=https://api.yourdomain.com" \
  --memory 512Mi
```

#### Option B: GKE

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create secrets
kubectl apply -f k8s/postgres-secret.yaml
kubectl apply -f k8s/redis-config.yaml
kubectl create secret generic app-secrets \
  --from-literal=JWT_SECRET=your-secret \
  --namespace=pos-repair-platform

# Deploy
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/web-deployment.yaml
```

## Architecture

```
┌─────────────┐
│   Cloud     │
│   Run/GKE   │
│             │
│  ┌───────┐  │
│  │  Web  │  │
│  └───┬───┘  │
│      │      │
│  ┌───▼───┐  │
│  │  API  │  │
│  └───┬───┘  │
│      │      │
└──────┼──────┘
       │
   ┌───┴────┐
   │        │
┌──▼──┐  ┌─▼───┐
│Redis│  │Cloud│
│Store│  │ SQL │
└─────┘  └─────┘
```

## Environment Variables

### Local Development

```env
DATABASE_URL=postgresql://postgres:password@localhost:5433/pos_repair_platform
REDIS_HOST=localhost
REDIS_PORT=6380
REDIS_PASSWORD=redispassword
```

### Production (GCP)

```env
DATABASE_URL=postgresql://user:pass@/db?host=/cloudsql/PROJECT:REGION:INSTANCE
REDIS_HOST=10.x.x.x  # Memorystore IP
REDIS_PORT=6379
REDIS_PASSWORD=  # Empty for Memorystore
```

## Key Files

- `GCP_DEPLOYMENT.md`: Detailed deployment guide
- `BULLMQ_SETUP.md`: BullMQ queue configuration
- `k8s/`: Kubernetes manifests
- `cloudbuild.yaml`: Cloud Build configuration
- `scripts/setup-gcp.sh`: Automated GCP setup

## Next Steps

1. ✅ Set up GCP resources
2. ✅ Configure Redis (Memorystore)
3. ✅ Configure PostgreSQL (Cloud SQL)
4. ✅ Build and push Docker images
5. ✅ Deploy to Cloud Run or GKE
6. 🔄 Set up custom domains
7. 🔄 Configure SSL certificates
8. 🔄 Set up monitoring and alerts
9. 🔄 Configure CI/CD pipeline

## Troubleshooting

### Connection Issues

- **Redis**: Verify Memorystore IP and VPC connector
- **PostgreSQL**: Check Cloud SQL connection string and authorized networks
- **VPC**: Ensure VPC peering is configured for Memorystore

### Deployment Issues

- **Cloud Run**: Check logs: `gcloud run services logs read pos-repair-api`
- **GKE**: Check pods: `kubectl get pods -n pos-repair-platform`
- **Build**: Check Cloud Build logs in GCP Console

## Support

For detailed instructions, see:
- `GCP_DEPLOYMENT.md` for deployment steps
- `BULLMQ_SETUP.md` for queue setup
- `k8s/README.md` for Kubernetes deployment

