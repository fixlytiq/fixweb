# Kubernetes Deployment

This directory contains Kubernetes manifests for deploying the POS Repair Platform to GKE (Google Kubernetes Engine).

## Prerequisites

- GKE cluster created
- `kubectl` configured to connect to your cluster
- Docker images pushed to GCR
- GCP Memorystore Redis instance created
- Cloud SQL instance created

## Setup Steps

### 1. Create Namespace

```bash
kubectl apply -f namespace.yaml
```

### 2. Create Secrets

```bash
# Update secrets with your values
kubectl apply -f postgres-secret.yaml
kubectl apply -f redis-config.yaml

# Create app secrets (JWT, Twilio, SMTP)
kubectl create secret generic app-secrets \
  --from-literal=JWT_SECRET=your-jwt-secret \
  --from-literal=TWILIO_ACCOUNT_SID=your-twilio-sid \
  --from-literal=TWILIO_AUTH_TOKEN=your-twilio-token \
  --from-literal=TWILIO_PHONE_NUMBER=your-phone-number \
  --from-literal=SMTP_HOST=smtp.gmail.com \
  --from-literal=SMTP_USER=your-email@gmail.com \
  --from-literal=SMTP_PASSWORD=your-app-password \
  --from-literal=SMTP_FROM=your-email@gmail.com \
  --namespace=pos-repair-platform
```

### 3. Update Configuration

Before deploying, update the following files:

- `redis-config.yaml`: Replace `YOUR_MEMORYSTORE_IP` with your Memorystore IP
- `api-deployment.yaml`: Replace `YOUR_PROJECT_ID` with your GCP project ID
- `web-deployment.yaml`: Replace `YOUR_PROJECT_ID` and API URL

### 4. Deploy Services

```bash
# Deploy API
kubectl apply -f api-deployment.yaml

# Deploy Web
kubectl apply -f web-deployment.yaml
```

### 5. Verify Deployment

```bash
# Check pods
kubectl get pods -n pos-repair-platform

# Check services
kubectl get services -n pos-repair-platform

# View logs
kubectl logs -f deployment/pos-repair-api -n pos-repair-platform
kubectl logs -f deployment/pos-repair-web -n pos-repair-platform
```

## Scaling

```bash
# Scale API
kubectl scale deployment pos-repair-api --replicas=3 -n pos-repair-platform

# Scale Web
kubectl scale deployment pos-repair-web --replicas=3 -n pos-repair-platform
```

## Updating

```bash
# Update image
kubectl set image deployment/pos-repair-api api=gcr.io/YOUR_PROJECT_ID/pos-repair-api:NEW_TAG -n pos-repair-platform
kubectl rollout status deployment/pos-repair-api -n pos-repair-platform
```

## Troubleshooting

### Pods Not Starting

```bash
# Describe pod
kubectl describe pod POD_NAME -n pos-repair-platform

# Check events
kubectl get events -n pos-repair-platform --sort-by='.lastTimestamp'
```

### Connection Issues

- Verify Memorystore IP is correct in `redis-config.yaml`
- Check Cloud SQL connection string in secrets
- Verify VPC peering is configured for Memorystore access

