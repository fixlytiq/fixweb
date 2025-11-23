# GCP Deployment Guide

This guide covers deploying the POS Repair Platform to Google Cloud Platform (GCP) with Memorystore for Redis, Cloud SQL for PostgreSQL, and deployment to Cloud Run or GKE.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [GCP Memorystore Setup](#gcp-memorystore-setup)
3. [Cloud SQL Setup](#cloud-sql-setup)
4. [BullMQ Configuration](#bullmq-configuration)
5. [Cloud Run Deployment](#cloud-run-deployment)
6. [GKE Deployment](#gke-deployment)
7. [Environment Variables](#environment-variables)

## Prerequisites

- Google Cloud Platform account
- `gcloud` CLI installed and configured
- Docker installed
- Project ID set: `gcloud config set project YOUR_PROJECT_ID`

## GCP Memorystore Setup

### 1. Create Memorystore Instance

```bash
# Set variables
export PROJECT_ID="your-project-id"
export REGION="us-central1"
export ZONE="us-central1-a"
export INSTANCE_ID="pos-repair-redis"
export MEMORY_SIZE_GB=1

# Create Memorystore Redis instance
gcloud redis instances create $INSTANCE_ID \
  --size=$MEMORY_SIZE_GB \
  --region=$REGION \
  --redis-version=redis_7_0 \
  --tier=basic \
  --project=$PROJECT_ID
```

### 2. Get Connection Details

```bash
# Get the instance IP address
gcloud redis instances describe $INSTANCE_ID \
  --region=$REGION \
  --format="value(host)"

# Get the port (default is 6379)
gcloud redis instances describe $INSTANCE_ID \
  --region=$REGION \
  --format="value(port)"
```

### 3. Configure VPC Connector (for Cloud Run)

```bash
# Create VPC connector
gcloud compute networks vpc-access connectors create pos-repair-connector \
  --region=$REGION \
  --subnet-project=$PROJECT_ID \
  --subnet=default \
  --min-instances=2 \
  --max-instances=3 \
  --machine-type=e2-micro
```

## Cloud SQL Setup

### 1. Create Cloud SQL Instance

```bash
# Create PostgreSQL instance
gcloud sql instances create pos-repair-postgres \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=$REGION \
  --root-password=YOUR_ROOT_PASSWORD \
  --storage-type=SSD \
  --storage-size=10GB \
  --backup-start-time=03:00 \
  --enable-bin-log
```

### 2. Create Database

```bash
# Create database
gcloud sql databases create pos_repair_platform \
  --instance=pos-repair-postgres
```

### 3. Create User

```bash
# Create database user
gcloud sql users create posrepair_user \
  --instance=pos-repair-postgres \
  --password=YOUR_DB_PASSWORD
```

### 4. Get Connection String

```bash
# Get connection name
gcloud sql instances describe pos-repair-postgres \
  --format="value(connectionName)"
```

## BullMQ Configuration

BullMQ is a Redis-based queue system for handling background jobs. We'll configure it to work with both local Redis and GCP Memorystore.

### Installation

```bash
cd apps/api
npm install bullmq
```

### Configuration

The BullMQ module is configured in `src/queue/queue.module.ts` to use the Redis connection from `RedisService`. It automatically works with both local Redis and GCP Memorystore.

See `BULLMQ_SETUP.md` for detailed usage examples.

## Cloud Run Deployment

### 1. Build and Push Images

```bash
# Set variables
export PROJECT_ID="your-project-id"
export REGION="us-central1"

# Build and push API image
docker build -t gcr.io/$PROJECT_ID/pos-repair-api:latest \
  -f apps/api/Dockerfile .
docker push gcr.io/$PROJECT_ID/pos-repair-api:latest

# Build and push Web image
docker build -t gcr.io/$PROJECT_ID/pos-repair-web:latest \
  -f apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com .
docker push gcr.io/$PROJECT_ID/pos-repair-web:latest
```

### 2. Deploy API Service

```bash
# Deploy API to Cloud Run
gcloud run deploy pos-repair-api \
  --image gcr.io/$PROJECT_ID/pos-repair-api:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --vpc-connector pos-repair-connector \
  --add-cloudsql-instances YOUR_CONNECTION_NAME \
  --set-env-vars "DATABASE_URL=postgresql://user:pass@/db?host=/cloudsql/YOUR_CONNECTION_NAME,REDIS_HOST=YOUR_REDIS_IP,REDIS_PORT=6379" \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 1 \
  --max-instances 10
```

### 3. Deploy Web Service

```bash
# Deploy Web to Cloud Run
gcloud run deploy pos-repair-web \
  --image gcr.io/$PROJECT_ID/pos-repair-web:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars "NEXT_PUBLIC_API_URL=https://api.yourdomain.com" \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10
```

## GKE Deployment

See `k8s/` directory for Kubernetes manifests.

## Environment Variables

### Local Development (.env)

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5433/pos_repair_platform

# Redis (Local)
REDIS_HOST=localhost
REDIS_PORT=6380
REDIS_PASSWORD=redispassword

# JWT
JWT_SECRET=your-secret-key-change-in-production

# Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_phone_number

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=your_email@gmail.com
```

### Production (GCP)

```env
# Database (Cloud SQL)
DATABASE_URL=postgresql://user:pass@/db?host=/cloudsql/PROJECT:REGION:INSTANCE

# Redis (Memorystore)
REDIS_HOST=10.x.x.x  # Memorystore IP
REDIS_PORT=6379
REDIS_PASSWORD=  # Memorystore doesn't use password by default

# JWT
JWT_SECRET=your-production-secret-key

# Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_phone_number

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=your_email@gmail.com
```

## Next Steps

1. ✅ Set up GCP Memorystore
2. ✅ Configure Cloud SQL
3. ✅ Update Redis service for GCP
4. ✅ Add BullMQ configuration
5. ✅ Deploy to Cloud Run or GKE
6. ✅ Set up monitoring and alerts
7. ✅ Configure custom domains
8. ✅ Set up CI/CD pipeline

