# CI/CD Setup with Google Cloud Build

This guide will help you set up continuous integration and continuous deployment (CI/CD) for your POS Repair Platform using Google Cloud Build and GitHub.

## Prerequisites

1. **Google Cloud Project** with billing enabled
2. **GitHub Repository** with your code
3. **gcloud CLI** installed and authenticated
4. **Google Cloud Build API** enabled
5. **Artifact Registry** or **Container Registry** enabled

## Step 1: Enable Required APIs

```bash
# Set your project ID
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable redis.googleapis.com
```

## Step 2: Connect GitHub Repository to Cloud Build

### Option A: Using Cloud Console (Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Cloud Build** > **Triggers**
3. Click **"Connect Repository"**
4. Select **GitHub (Cloud Build GitHub App)**
5. Authenticate with GitHub and select your repository
6. Choose the repository: `fixlytiq/fixweb` (or your repo)
7. Click **"Connect"**

### Option B: Using GitHub OAuth Token

```bash
# Create a GitHub personal access token with repo permissions
# Then connect using gcloud CLI
gcloud builds triggers create github \
  --repo-name=fixweb \
  --repo-owner=fixlytiq \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml \
  --name="deploy-to-cloud-run"
```

## Step 3: Set Up Artifact Registry

```bash
# Create an Artifact Registry repository for Docker images
gcloud artifacts repositories create pos-repair-images \
  --repository-format=docker \
  --location=us-central1 \
  --description="Docker images for POS Repair Platform"

# Configure Docker authentication
gcloud auth configure-docker us-central1-docker.pkg.dev
```

## Step 4: Create Cloud Build Configuration File

The `cloudbuild.yaml` file is already in your repository. Update it with your project details:

```yaml
steps:
  # Build API image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/pos-repair-images/pos-repair-api:$SHORT_SHA'
      - '-t'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/pos-repair-images/pos-repair-api:latest'
      - '-f'
      - 'apps/api/Dockerfile'
      - '.'

  # Build Web image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/pos-repair-images/pos-repair-web:$SHORT_SHA'
      - '-t'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/pos-repair-images/pos-repair-web:latest'
      - '--build-arg'
      - 'NEXT_PUBLIC_API_URL=https://pos-repair-api-${PROJECT_NUMBER}.us-central1.run.app'
      - '-f'
      - 'apps/web/Dockerfile'
      - '.'

  # Build Owner image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/pos-repair-images/pos-repair-owner:$SHORT_SHA'
      - '-t'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/pos-repair-images/pos-repair-owner:latest'
      - '--build-arg'
      - 'NEXT_PUBLIC_API_URL=https://pos-repair-api-${PROJECT_NUMBER}.us-central1.run.app'
      - '-f'
      - 'apps/owner/Dockerfile'
      - '.'

  # Push API image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/pos-repair-images/pos-repair-api:$SHORT_SHA'

  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/pos-repair-images/pos-repair-api:latest'

  # Push Web image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/pos-repair-images/pos-repair-web:$SHORT_SHA'

  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/pos-repair-images/pos-repair-web:latest'

  # Push Owner image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/pos-repair-images/pos-repair-owner:$SHORT_SHA'

  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/pos-repair-images/pos-repair-owner:latest'

  # Deploy API to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'pos-repair-api'
      - '--image'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/pos-repair-images/pos-repair-api:$SHORT_SHA'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
      - '--memory'
      - '512Mi'
      - '--cpu'
      - '1'
      - '--min-instances'
      - '1'
      - '--max-instances'
      - '10'

  # Deploy Web to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'pos-repair-web'
      - '--image'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/pos-repair-images/pos-repair-web:$SHORT_SHA'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
      - '--memory'
      - '512Mi'
      - '--cpu'
      - '1'
      - '--min-instances'
      - '0'
      - '--max-instances'
      - '10'

  # Deploy Owner to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'pos-repair-owner'
      - '--image'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/pos-repair-images/pos-repair-owner:$SHORT_SHA'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
      - '--memory'
      - '512Mi'
      - '--cpu'
      - '1'
      - '--min-instances'
      - '0'
      - '--max-instances'
      - '10'

options:
  machineType: 'E2_HIGHCPU_8'
  logging: CLOUD_LOGGING_ONLY

timeout: '3600s'

images:
  - 'us-central1-docker.pkg.dev/$PROJECT_ID/pos-repair-images/pos-repair-api:$SHORT_SHA'
  - 'us-central1-docker.pkg.dev/$PROJECT_ID/pos-repair-images/pos-repair-api:latest'
  - 'us-central1-docker.pkg.dev/$PROJECT_ID/pos-repair-images/pos-repair-web:$SHORT_SHA'
  - 'us-central1-docker.pkg.dev/$PROJECT_ID/pos-repair-images/pos-repair-web:latest'
  - 'us-central1-docker.pkg.dev/$PROJECT_ID/pos-repair-images/pos-repair-owner:$SHORT_SHA'
  - 'us-central1-docker.pkg.dev/$PROJECT_ID/pos-repair-images/pos-repair-owner:latest'
```

## Step 5: Grant Cloud Build Permissions

```bash
# Get your project number
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')

# Grant Cloud Build service account necessary permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"
```

## Step 6: Store Environment Variables as Secrets

For sensitive data like JWT secrets, database passwords, etc., use Secret Manager:

```bash
# Create secrets in Secret Manager
echo -n "your-jwt-secret" | gcloud secrets create jwt-secret --data-file=-
echo -n "your-database-url" | gcloud secrets create database-url --data-file=-
echo -n "your-redis-host" | gcloud secrets create redis-host --data-file=-

# Grant Cloud Run access to secrets
gcloud secrets add-iam-policy-binding jwt-secret \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

Update your Cloud Run services to use secrets (see Step 7).

## Step 7: Update Cloud Run Services with Environment Variables

Before deploying, configure your Cloud Run services with environment variables:

```bash
# Update API service with environment variables
gcloud run services update pos-repair-api \
  --region=us-central1 \
  --update-env-vars="DATABASE_URL=postgresql://user:pass@/db?host=/cloudsql/PROJECT:REGION:INSTANCE" \
  --update-env-vars="REDIS_HOST=YOUR_REDIS_IP" \
  --update-env-vars="REDIS_PORT=6379" \
  --update-secrets="JWT_SECRET=jwt-secret:latest" \
  --add-cloudsql-instances="PROJECT:REGION:INSTANCE" \
  --vpc-connector="pos-repair-connector"

# Update Web service
gcloud run services update pos-repair-web \
  --region=us-central1 \
  --update-env-vars="NEXT_PUBLIC_API_URL=https://pos-repair-api-${PROJECT_NUMBER}.us-central1.run.app" \
  --update-env-vars="NODE_ENV=production"

# Update Owner service
gcloud run services update pos-repair-owner \
  --region=us-central1 \
  --update-env-vars="NEXT_PUBLIC_API_URL=https://pos-repair-api-${PROJECT_NUMBER}.us-central1.run.app" \
  --update-env-vars="NODE_ENV=production"
```

## Step 8: Create Cloud Build Triggers

### Using Cloud Console:

1. Go to **Cloud Build** > **Triggers**
2. Click **"Create Trigger"**
3. Configure:
   - **Name**: `deploy-main-branch`
   - **Event**: Push to a branch
   - **Branch**: `^main$`
   - **Configuration**: Cloud Build configuration file
   - **Location**: Repository
   - **Cloud Build configuration file**: `cloudbuild.yaml`
4. Click **"Create"**

### Using gcloud CLI:

```bash
gcloud builds triggers create github \
  --name="deploy-main-branch" \
  --repo-name=fixweb \
  --repo-owner=fixlytiq \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml \
  --region=us-central1
```

## Step 9: Test the CI/CD Pipeline

1. Make a small change to your code
2. Commit and push to the `main` branch:
   ```bash
   git add .
   git commit -m "Test CI/CD pipeline"
   git push origin main
   ```
3. Go to **Cloud Build** > **History** to see the build progress
4. Once complete, check Cloud Run to see your services updated

## Step 10: Set Up Branch Protection (Optional)

For production deployments, you may want to:

1. Require pull requests for main branch
2. Add build status checks
3. Require code review before merging

## Advanced: Separate Build Configs for Different Environments

You can create separate triggers for different branches:

```bash
# Production (main branch)
gcloud builds triggers create github \
  --name="deploy-production" \
  --repo-name=fixweb \
  --repo-owner=fixlytiq \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.prod.yaml \
  --region=us-central1

# Staging (develop branch)
gcloud builds triggers create github \
  --name="deploy-staging" \
  --repo-name=fixweb \
  --repo-owner=fixlytiq \
  --branch-pattern="^develop$" \
  --build-config=cloudbuild.staging.yaml \
  --region=us-central1
```

## Monitoring and Troubleshooting

### View Build Logs:
```bash
gcloud builds list
gcloud builds log BUILD_ID
```

### View Cloud Run Logs:
```bash
gcloud run services logs read pos-repair-api --region=us-central1
gcloud run services logs read pos-repair-web --region=us-central1
```

### Check Build Status:
- Go to [Cloud Build Console](https://console.cloud.google.com/cloud-build)
- View build history and logs

## Important Notes

1. **First Deployment**: The first deployment may fail if Cloud Run services don't exist. Deploy them manually first:
   ```bash
   # Manual first deployment
   gcloud run deploy pos-repair-api --image=IMAGE_URL --region=us-central1 --allow-unauthenticated
   ```

2. **Database Migrations**: Ensure your Cloud SQL instance is accessible from Cloud Run and migrations run successfully.

3. **Environment Variables**: Use Secret Manager for sensitive data, not plain environment variables.

4. **Build Timeout**: The default timeout is 10 minutes. Adjust in `cloudbuild.yaml` if builds take longer.

5. **Cost Optimization**: Consider using `--min-instances=0` for non-critical services to reduce costs.

## Next Steps

1. Set up monitoring and alerts
2. Configure custom domains
3. Set up automated backups
4. Implement blue-green deployments for zero-downtime
5. Add automated testing to the build pipeline

