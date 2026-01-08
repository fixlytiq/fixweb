# Quick CI/CD Setup for Existing Cloud Run Services

Since you already have Cloud Run services deployed, here's the fastest way to set up CI/CD:

## 🚀 Quick Setup (5 minutes)

### 1. Get Your Service Names

```bash
# List your existing Cloud Run services
gcloud run services list

# Note the service names and region
# Example output:
# SERVICE            REGION       URL
# pos-repair-api     us-central1  https://pos-repair-api-xxxxx.run.app
# pos-repair-web     us-central1  https://pos-repair-web-xxxxx.run.app
# pos-repair-owner   us-central1  https://pos-repair-owner-xxxxx.run.app
```

### 2. Enable APIs & Grant Permissions

```bash
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# Enable APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# Grant permissions
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
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

### 3. Create Artifact Registry (if needed)

```bash
# Check if repository exists
gcloud artifacts repositories list --location=us-central1

# Create if it doesn't exist
gcloud artifacts repositories create pos-repair-images \
  --repository-format=docker \
  --location=us-central1 \
  --description="Docker images for POS Repair Platform"
```

### 4. Update cloudbuild.yaml

**IMPORTANT:** Before pushing, update these in `cloudbuild.yaml`:

1. **API URL**: Replace `https://pos-repair-api-${PROJECT_NUMBER}.us-central1.run.app` with your actual API URL
2. **Service names**: If your services have different names, update them
3. **Region**: If not `us-central1`, update it

### 5. Connect GitHub (Cloud Console)

1. Go to: https://console.cloud.google.com/cloud-build/triggers
2. Click **"Connect Repository"**
3. Select **GitHub (Cloud Build GitHub App)**
4. Click **"Install Google Cloud Build"** on GitHub
5. Authorize and select repository: `fixlytiq/fixweb`
6. Click **"Connect"**

### 6. Create Trigger

1. Click **"Create Trigger"**
2. Fill in:
   - **Name**: `deploy-main-branch`
   - **Event**: Push to a branch
   - **Branch**: `^main$`
   - **Configuration**: Cloud Build configuration file
   - **Cloud Build configuration file**: `cloudbuild.yaml`
3. Click **"Create"**

### 7. Test It!

```bash
# Make a small change and push
git add .
git commit -m "Test CI/CD"
git push origin main

# Watch the build
# Go to: https://console.cloud.google.com/cloud-build/builds
```

## ⚠️ Important Notes

1. **Service Names**: The `cloudbuild.yaml` uses service names `pos-repair-api`, `pos-repair-web`, and `pos-repair-owner`. If yours are different, update them.

2. **API URL**: Update `NEXT_PUBLIC_API_URL` in the build args with your actual API service URL.

3. **Environment Variables**: The deployment preserves your existing environment variables. Only the container image is updated.

4. **No Traffic During Deploy**: The config uses `--no-traffic` then migrates traffic, so there's minimal downtime.

## 🔍 Verify Your Setup

```bash
# Check your services
gcloud run services list

# View build history
gcloud builds list --limit=5

# Check build logs
gcloud builds log BUILD_ID
```

That's it! Every push to `main` will now automatically build and deploy to your Cloud Run services! 🎉

