# CI/CD Setup for Existing Cloud Run Deployment

This guide helps you connect your GitHub repository to Google Cloud Build to automatically deploy to your **existing** Cloud Run services.

## Prerequisites ✅

Since you already have:
- ✅ Cloud Run services deployed
- ✅ Memorystore (Redis) configured
- ✅ Cloud SQL (PostgreSQL) configured
- ✅ VPC Connector set up

We just need to connect Git and set up the triggers!

## Step 1: Enable Cloud Build API (if not already enabled)

```bash
# Set your project ID
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# Enable Cloud Build API
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

## Step 2: Set Up Artifact Registry

Create a repository for your Docker images (if you don't have one):

```bash
# Check if you already have one
gcloud artifacts repositories list --location=us-central1

# If not, create one
gcloud artifacts repositories create pos-repair-images \
  --repository-format=docker \
  --location=us-central1 \
  --description="Docker images for POS Repair Platform"

# Configure Docker authentication
gcloud auth configure-docker us-central1-docker.pkg.dev
```

## Step 3: Grant Cloud Build Permissions

Cloud Build needs permissions to deploy to Cloud Run:

```bash
# Get your project number
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')

# Grant necessary permissions
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

## Step 4: Get Your Existing Cloud Run Service URLs

First, get your existing service names and regions:

```bash
# List your Cloud Run services
gcloud run services list

# Example output:
# SERVICE              REGION       URL
# pos-repair-api       us-central1  https://pos-repair-api-xxxxx.run.app
# pos-repair-web       us-central1  https://pos-repair-web-xxxxx.run.app
# pos-repair-owner     us-central1  https://pos-repair-owner-xxxxx.run.app
```

**Note down:**
- Your service names (e.g., `pos-repair-api`, `pos-repair-web`, `pos-repair-owner`)
- Your region (e.g., `us-central1`)
- Your API URL (needed for NEXT_PUBLIC_API_URL)

## Step 5: Update cloudbuild.yaml

The `cloudbuild.yaml` file has been updated to work with your existing services. Make sure to update:

1. Replace `YOUR_PROJECT_ID` with your actual project ID
2. Replace the API URL in `NEXT_PUBLIC_API_URL` with your actual API service URL
3. Update region if different from `us-central1`
4. Update service names if they're different

## Step 6: Connect GitHub Repository to Cloud Build

### Option A: Using Cloud Console (Easiest) ⭐

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Cloud Build** > **Triggers**
3. Click **"Connect Repository"**
4. Select **GitHub (Cloud Build GitHub App)**
5. Click **"Install Google Cloud Build"** if prompted
6. Authenticate with GitHub
7. Select your repository: `fixlytiq/fixweb` (or your repo name)
8. Click **"Connect"**

### Option B: Using gcloud CLI

```bash
# Connect repository (requires GitHub OAuth token)
gcloud builds triggers create github \
  --repo-name=fixweb \
  --repo-owner=fixlytiq \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml \
  --name="deploy-to-cloud-run"
```

## Step 7: Create Build Trigger

After connecting the repository:

1. In Cloud Build Triggers, click **"Create Trigger"**
2. Configure:
   - **Name**: `deploy-main-branch`
   - **Event**: Push to a branch
   - **Source**: Your connected repository
   - **Branch**: `^main$` (or your main branch)
   - **Configuration**: Cloud Build configuration file
   - **Location**: Repository
   - **Cloud Build configuration file**: `cloudbuild.yaml`
3. Click **"Create"**

## Step 8: Test the Pipeline

1. Make a small change (e.g., update a comment)
2. Commit and push:
   ```bash
   git add .
   git commit -m "Test CI/CD deployment"
   git push origin main
   ```
3. Watch the build:
   - Go to **Cloud Build** > **History**
   - You should see a build start automatically
   - Click on it to see logs in real-time
4. Once complete, check Cloud Run:
   - Go to **Cloud Run** > **Services**
   - Your services should be updated with the new image

## Important: Preserve Existing Environment Variables

Your existing Cloud Run services already have environment variables configured. The `cloudbuild.yaml` file uses `--update-service` which **preserves existing environment variables**. 

If you need to update environment variables, do it separately:

```bash
# Update API environment variables (if needed)
gcloud run services update pos-repair-api \
  --region=us-central1 \
  --update-env-vars="KEY=VALUE"

# Update Web environment variables
gcloud run services update pos-repair-web \
  --region=us-central1 \
  --update-env-vars="NEXT_PUBLIC_API_URL=https://your-actual-api-url.run.app"
```

## Troubleshooting

### Build Fails with "Permission Denied"
- Make sure you ran Step 3 (granting permissions)
- Wait a few minutes after granting permissions

### Build Succeeds but Service Not Updated
- Check that service names in `cloudbuild.yaml` match your actual services
- Check the region matches
- View Cloud Run logs: `gcloud run services logs read SERVICE_NAME --region=REGION`

### "Service not found" Error
- Verify service names: `gcloud run services list`
- Update `cloudbuild.yaml` with correct service names

## Next Steps

1. ✅ Push your changes and watch the first build
2. Set up branch protection (require PRs for main)
3. Add build status badges to your README
4. Consider staging environment (deploy `develop` branch to a staging service)
5. Set up monitoring and alerts for failed builds

## Quick Reference

```bash
# View build history
gcloud builds list --limit=10

# View specific build logs
gcloud builds log BUILD_ID

# View Cloud Run service logs
gcloud run services logs read pos-repair-api --region=us-central1 --limit=50

# Manually trigger a build (for testing)
gcloud builds triggers run deploy-main-branch --branch=main
```

