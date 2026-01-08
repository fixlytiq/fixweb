# CI/CD Configuration - Ready to Use

Your `cloudbuild.yaml` has been configured with your actual Cloud Run service URLs!

## ✅ What's Configured

- **API Service**: `pos-repair-api` → https://pos-repair-api-986263545678.us-central1.run.app
- **Web Service**: `pos-repair-web` → https://pos-repair-web-986263545678.us-central1.run.app
- **Owner Service**: Commented out (ready to uncomment when you deploy it)
- **Region**: `us-central1`
- **API URL**: Configured for Next.js apps: `https://pos-repair-api-986263545678.us-central1.run.app`

## 🚀 Quick Setup Steps

### 1. Get Your Project ID

```bash
# Your project number from the URL is: 986263545678
# Get your project ID
gcloud projects list

# Or get it from the current config
gcloud config get-value project
```

### 2. Enable APIs & Grant Permissions

```bash
export PROJECT_ID="your-actual-project-id"  # Replace with your project ID
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
# Check if it exists
gcloud artifacts repositories list --location=us-central1

# Create if needed
gcloud artifacts repositories create pos-repair-images \
  --repository-format=docker \
  --location=us-central1 \
  --description="Docker images for POS Repair Platform"
```

### 4. Connect GitHub Repository

**Easiest way (Cloud Console):**

1. Go to: https://console.cloud.google.com/cloud-build/triggers?project=YOUR_PROJECT_ID
2. Click **"Connect Repository"**
3. Select **GitHub (Cloud Build GitHub App)**
4. Install the app and authorize with GitHub
5. Select repository: `fixlytiq/fixweb` (or your repo name)
6. Click **"Connect"**

### 5. Create Build Trigger

1. Click **"Create Trigger"**
2. Configure:
   - **Name**: `deploy-main-branch`
   - **Event**: Push to a branch
   - **Source**: Your connected repository
   - **Branch**: `^main$`
   - **Configuration**: Cloud Build configuration file (yaml or json)
   - **Cloud Build configuration file location**: Repository
   - **Cloud Build configuration file**: `cloudbuild.yaml`
3. Click **"Create"**

### 6. Test It!

```bash
# Commit and push the updated cloudbuild.yaml
git add cloudbuild.yaml
git commit -m "Configure CI/CD for Cloud Run deployment"
git push origin main

# Watch the build
# Go to: https://console.cloud.google.com/cloud-build/builds
```

## 📝 What Happens on Each Push

1. **Builds** Docker images for API and Web
2. **Pushes** images to Artifact Registry
3. **Deploys** new revision to Cloud Run (with `--no-traffic`)
4. **Migrates** traffic to new revision (zero-downtime)

## 🔧 When You're Ready to Deploy Owner App

1. First deploy it manually to Cloud Run:
   ```bash
   gcloud run deploy pos-repair-owner \
     --image=IMAGE_URL \
     --region=us-central1 \
     --platform=managed \
     --allow-unauthenticated
   ```

2. Then uncomment the Owner sections in `cloudbuild.yaml`:
   - Build Owner image step
   - Push Owner image steps
   - Deploy Owner step
   - Migrate traffic for Owner step
   - Owner images in the images list

## ⚠️ Important Notes

1. **Environment Variables**: Your existing environment variables in Cloud Run are preserved. Only the container image is updated.

2. **VPC Connector & Cloud SQL**: If your services use VPC connector or Cloud SQL, those configurations are preserved.

3. **First Build**: The first build may take longer (10-15 minutes) as it builds all images.

4. **Subsequent Builds**: Faster builds as Docker layers are cached.

## 🐛 Troubleshooting

### Build fails with "permission denied"
- Make sure you ran the permission grant commands (Step 2)
- Wait a few minutes after granting permissions

### Build succeeds but service not updated
- Check service names match: `gcloud run services list`
- Check the region matches (`us-central1`)

### "Service not found" error
- Verify service names in Cloud Run console
- Update `cloudbuild.yaml` with correct service names if different

### View Build Logs
```bash
# List recent builds
gcloud builds list --limit=5

# View specific build logs
gcloud builds log BUILD_ID
```

### View Service Logs
```bash
# API logs
gcloud run services logs read pos-repair-api --region=us-central1 --limit=50

# Web logs
gcloud run services logs read pos-repair-web --region=us-central1 --limit=50
```

## 🎉 You're All Set!

Once you complete these steps, every push to `main` will automatically:
- Build your Docker images
- Deploy to your existing Cloud Run services
- Update your API and Web applications

No more manual deployments! 🚀

