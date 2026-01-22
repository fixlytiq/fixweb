# Complete GCP Setup Guide - Step by Step

This guide will walk you through hosting your POS Repair Platform on Google Cloud Platform with GitHub integration and CI/CD.

---

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] **Google Cloud Account** with billing enabled
  - Sign up at: https://console.cloud.google.com
  - Enable billing: https://console.cloud.google.com/billing
  
- [ ] **gcloud CLI** installed
  - Download: https://cloud.google.com/sdk/docs/install
  - Verify: Open PowerShell and run `gcloud --version`
  
- [ ] **GitHub Repository** 
  - Your code should be pushed to a GitHub repository
  - You need admin access to the repository

- [ ] **Git Bash or WSL** (for running bash scripts on Windows)
  - Git Bash comes with Git for Windows
  - Or install WSL: `wsl --install` in PowerShell (as admin)

---

## Step 1: Install and Configure gcloud CLI

### 1.1 Install gcloud CLI

1. Download the installer from: https://cloud.google.com/sdk/docs/install
2. Run the installer and follow the prompts
3. Restart your terminal/PowerShell

### 1.2 Authenticate with Google Cloud

Open PowerShell or Command Prompt and run:

```powershell
gcloud init
```

This will:
- Open a browser for you to sign in
- Ask you to select/create a project
- Set up your default configuration

**Note:** If you don't have a project yet, you can create one in the next step.

### 1.3 Verify Installation

```powershell
gcloud auth list
gcloud config list
```

You should see your account and project information.

---

## Step 2: Set Up GCP Project and Resources

You have two options:

### Option A: Use the Automated Setup Script (Recommended)

The script will create all necessary GCP resources automatically.

#### For Windows (using Git Bash or WSL):

1. Open **Git Bash** (or WSL terminal)

2. Navigate to your project:
   ```bash
   cd /c/fixweb-1/pos-repair-platform
   ```

3. Make the script executable:
   ```bash
   chmod +x scripts/setup-gcp-from-scratch.sh
   ```

4. Run the setup script:
   ```bash
   ./scripts/setup-gcp-from-scratch.sh
   ```

5. When prompted:
   - **Project ID**: Enter an existing GCP project ID, or type `new` to create one
     - If creating new: You'll need a billing account ID
     - Get billing accounts: `gcloud billing accounts list`
   - **PostgreSQL Root Password**: Enter a strong password (save it securely!)
   - **Database User Password**: Enter a password for the app user (save it securely!)

6. The script will:
   - ✅ Enable required GCP APIs
   - ✅ Create Artifact Registry (for Docker images)
   - ✅ Create VPC Connector (for private networking)
   - ✅ Create Memorystore Redis instance (takes 5-10 minutes)
   - ✅ Create Cloud SQL PostgreSQL instance (takes 5-10 minutes)
   - ✅ Create database and user
   - ✅ Generate JWT secret
   - ✅ Write `.gcp-config` file with all configuration

7. **Important:** The script will create a `.gcp-config` file. **DO NOT commit this file** (it's already in `.gitignore`).

#### For Windows (using PowerShell - Manual Steps):

If you prefer not to use bash, follow **Option B** below.

### Option B: Manual Setup (PowerShell)

If you prefer to set up manually or the script doesn't work, follow these steps:

#### 2.1 Create or Select GCP Project

```powershell
# List existing projects
gcloud projects list

# Create a new project (replace YOUR_PROJECT_ID with a unique ID)
gcloud projects create YOUR_PROJECT_ID --name="POS Repair Platform"

# Set the project
gcloud config set project YOUR_PROJECT_ID

# Link billing account (replace BILLING_ACCOUNT_ID)
gcloud billing projects link YOUR_PROJECT_ID --billing-account=BILLING_ACCOUNT_ID

# Get project number
$PROJECT_NUMBER = gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)'
```

#### 2.2 Enable Required APIs

```powershell
gcloud services enable `
    redis.googleapis.com `
    sqladmin.googleapis.com `
    run.googleapis.com `
    cloudbuild.googleapis.com `
    artifactregistry.googleapis.com `
    vpcaccess.googleapis.com `
    servicenetworking.googleapis.com `
    compute.googleapis.com
```

#### 2.3 Grant Cloud Build Permissions

```powershell
$PROJECT_NUMBER = gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)'

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID `
    --member="serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" `
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID `
    --member="serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" `
    --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID `
    --member="serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" `
    --role="roles/artifactregistry.writer"
```

#### 2.4 Create Artifact Registry

```powershell
gcloud artifacts repositories create pos-repair-images `
    --repository-format=docker `
    --location=us-central1 `
    --description="Docker images for POS Repair Platform"
```

#### 2.5 Create VPC Connector

```powershell
gcloud compute networks vpc-access connectors create pos-repair-connector `
    --region=us-central1 `
    --subnet-project=YOUR_PROJECT_ID `
    --subnet=default `
    --min-instances=2 `
    --max-instances=3 `
    --machine-type=e2-micro
```

#### 2.6 Create Memorystore Redis

```powershell
# This takes 5-10 minutes
gcloud redis instances create pos-repair-redis `
    --size=1 `
    --region=us-central1 `
    --redis-version=redis_7_0 `
    --tier=basic

# Get Redis IP (after creation completes)
$REDIS_IP = gcloud redis instances describe pos-repair-redis --region=us-central1 --format="value(host)"
```

#### 2.7 Create Cloud SQL PostgreSQL

```powershell
# Set passwords (use strong passwords!)
$ROOT_PASSWORD = "YOUR_ROOT_PASSWORD"
$DB_PASSWORD = "YOUR_DB_USER_PASSWORD"

# Create instance (takes 5-10 minutes)
gcloud sql instances create pos-repair-postgres `
    --database-version=POSTGRES_15 `
    --tier=db-f1-micro `
    --region=us-central1 `
    --root-password=$ROOT_PASSWORD `
    --storage-type=SSD `
    --storage-size=10GB `
    --backup-start-time=03:00 `
    --enable-bin-log

# Get connection name
$CONNECTION_NAME = gcloud sql instances describe pos-repair-postgres --format="value(connectionName)"

# Create database
gcloud sql databases create pos_repair_platform --instance=pos-repair-postgres

# Create database user
gcloud sql users create posrepair_user `
    --instance=pos-repair-postgres `
    --password=$DB_PASSWORD
```

#### 2.8 Generate JWT Secret

```powershell
# Generate a secure random secret
$JWT_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

#### 2.9 Create .gcp-config File

Create a file `.gcp-config` in `pos-repair-platform` directory with:

```bash
PROJECT_ID=YOUR_PROJECT_ID
PROJECT_NUMBER=YOUR_PROJECT_NUMBER
REGION=us-central1
ZONE=us-central1-a

# Redis (Memorystore)
REDIS_INSTANCE=pos-repair-redis
REDIS_IP=YOUR_REDIS_IP
REDIS_PORT=6379

# PostgreSQL (Cloud SQL)
SQL_INSTANCE=pos-repair-postgres
SQL_DATABASE=pos_repair_platform
SQL_USER=posrepair_user
SQL_PASSWORD=YOUR_DB_PASSWORD
SQL_ROOT_PASSWORD=YOUR_ROOT_PASSWORD
CONNECTION_NAME=YOUR_CONNECTION_NAME

# VPC
VPC_CONNECTOR=pos-repair-connector
VPC_NETWORK=default
VPC_SUBNET=default

# Artifact Registry
ARTIFACT_REPO=pos-repair-images
ARTIFACT_REGISTRY=us-central1-docker.pkg.dev/YOUR_PROJECT_ID/pos-repair-images

# JWT
JWT_SECRET=YOUR_JWT_SECRET

# Cloud Run URLs (will be available after first deployment)
API_URL=https://pos-repair-api-YOUR_PROJECT_NUMBER.us-central1.run.app
WEB_URL=https://pos-repair-web-YOUR_PROJECT_NUMBER.us-central1.run.app
```

Replace all `YOUR_*` placeholders with actual values from the commands above.

---

## Step 3: Connect GitHub Repository to Cloud Build

### 3.1 Open Cloud Build Triggers

1. Go to: https://console.cloud.google.com/cloud-build/triggers
2. Make sure you're in the correct project (check the project dropdown at the top)
3. If prompted, enable the Cloud Build API

### 3.2 Connect Your Repository

1. Click **"Connect Repository"** button
2. Select **"GitHub (Cloud Build GitHub App)"**
3. Click **"Install Google Cloud Build"** if you haven't already
4. Sign in to GitHub and authorize Google Cloud Build
5. Select your **GitHub organization** (or personal account)
6. Select the **repository** that contains your code
7. Click **"Connect"**

You should now see your repository listed.

---

## Step 4: Create Build Trigger

### 4.1 Create the Trigger

1. In Cloud Build → Triggers, click **"Create Trigger"**
2. Fill in the form:

   **Basic Information:**
   - **Name**: `deploy-main`
   - **Description**: `Deploy to Cloud Run on push to main`

   **Event Configuration:**
   - **Event**: Select **"Push to a branch"**
   - **Source**: Select your connected repository
   - **Branch**: `^main$` (regex pattern for main branch)

   **Configuration:**
   - **Type**: Select **"Cloud Build configuration file (yaml or json)"**
   - **Location**: Select **"Repository"**
   - **Cloud Build configuration file**: `cloudbuild.yaml`

### 4.2 Add Substitution Variables

1. Expand **"Substitution variables"** section
2. Click **"Add variable"** for each of the following:

   | Variable Name | Value (from `.gcp-config`) |
   |--------------|---------------------------|
   | `_SQL_CONNECTION_NAME` | `CONNECTION_NAME` value |
   | `_VPC_CONNECTOR` | `pos-repair-connector` (or your connector name) |
   | `_DATABASE_URL` | `postgresql://SQL_USER:SQL_PASSWORD@/SQL_DATABASE?host=/cloudsql/CONNECTION_NAME` |
   | `_REDIS_HOST` | `REDIS_IP` value |
   | `_JWT_SECRET` | `JWT_SECRET` value |
   | `_FRONTEND_URL` | `https://pos-repair-web-PROJECT_NUMBER.us-central1.run.app,https://pos-repair-owner-PROJECT_NUMBER.us-central1.run.app` |

   **Example `_DATABASE_URL` format:**
   ```
   postgresql://posrepair_user:YOUR_PASSWORD@/pos_repair_platform?host=/cloudsql/YOUR_PROJECT_ID:us-central1:pos-repair-postgres
   ```

   **Example `_FRONTEND_URL` format:**
   ```
   https://pos-repair-web-123456789.us-central1.run.app,https://pos-repair-owner-123456789.us-central1.run.app
   ```
   
   Replace `123456789` with your actual `PROJECT_NUMBER` from `.gcp-config`.

3. Click **"Create"** to save the trigger

---

## Step 5: First Deployment

### 5.1 Push to GitHub

Now trigger your first deployment by pushing to the `main` branch:

```powershell
# Make sure you're in the project directory
cd c:\fixweb-1\pos-repair-platform

# Check git status
git status

# Add any changes (if needed)
git add .

# Commit (if you have changes)
git commit -m "Setup GCP deployment"

# Push to main branch
git push origin main
```

### 5.2 Monitor the Build

1. Go to: https://console.cloud.google.com/cloud-build/builds
2. You should see a new build running
3. Click on it to see real-time logs
4. The build will:
   - Build Docker images for API and Web
   - Push images to Artifact Registry
   - Deploy to Cloud Run
   - Update traffic to new revisions

**Build time:** Typically 10-15 minutes for the first build.

### 5.3 Check Deployment Status

1. Go to: https://console.cloud.google.com/run
2. You should see two services:
   - `pos-repair-api`
   - `pos-repair-web`
3. Click on each service to see:
   - URL
   - Status (should be "Active")
   - Recent revisions

---

## Step 6: Verify Your Deployment

### 6.1 Get Your URLs

Your application will be available at:

- **API**: `https://pos-repair-api-PROJECT_NUMBER.us-central1.run.app`
- **Web**: `https://pos-repair-web-PROJECT_NUMBER.us-central1.run.app`

Replace `PROJECT_NUMBER` with your actual project number from `.gcp-config`.

### 6.2 Test the API

```powershell
# Test API health endpoint (adjust URL)
curl https://pos-repair-api-PROJECT_NUMBER.us-central1.run.app/health
```

### 6.3 Test the Web App

Open the web URL in your browser. You should see your application.

---

## Step 7: Database Migrations

After the first deployment, you need to run database migrations.

### Option A: Run Migrations Locally (Recommended for first time)

1. Set up your local environment variables to point to Cloud SQL:

   ```powershell
   # Get connection name from .gcp-config
   # Install Cloud SQL Proxy: https://cloud.google.com/sql/docs/postgres/connect-admin-proxy
   
   # Start Cloud SQL Proxy (in a separate terminal)
   cloud-sql-proxy CONNECTION_NAME
   ```

2. Update your local `.env` to use the proxy connection

3. Run migrations:
   ```powershell
   cd apps/api
   npx prisma migrate deploy
   ```

### Option B: Run Migrations in Cloud Run (After deployment)

You can add a migration step to your `cloudbuild.yaml` or run migrations manually through Cloud Run.

---

## Step 8: Continuous Deployment

🎉 **You're all set!** From now on:

- **Every push to `main` branch** will automatically:
  1. Trigger Cloud Build
  2. Build new Docker images
  3. Deploy to Cloud Run
  4. Update traffic to new revisions

- **No manual steps required!**

---

## Troubleshooting

### Build Fails

1. **Check Cloud Build logs:**
   - Go to: https://console.cloud.google.com/cloud-build/builds
   - Click on the failed build
   - Review error messages

2. **Common issues:**
   - **Substitution variables incorrect**: Double-check values in trigger settings match `.gcp-config`
   - **Permissions**: Re-run Step 2.3 to grant Cloud Build permissions
   - **APIs not enabled**: Re-run Step 2.2 to enable APIs

### API Returns 502 or Crashes

1. **Check Cloud Run logs:**
   - Go to: https://console.cloud.google.com/run
   - Click on `pos-repair-api`
   - Click "Logs" tab

2. **Common issues:**
   - **Database connection**: Verify `_DATABASE_URL` format is correct
   - **Redis connection**: Verify `_REDIS_HOST` is the correct IP
   - **VPC Connector**: Ensure VPC connector name matches
   - **Environment variables**: Check all required env vars are set

### Web App Can't Reach API

1. **Check `NEXT_PUBLIC_API_URL`:**
   - In `cloudbuild.yaml`, verify the API URL uses correct `PROJECT_NUMBER`
   - The URL should be: `https://pos-repair-api-PROJECT_NUMBER.us-central1.run.app`

2. **CORS issues:**
   - Ensure `_FRONTEND_URL` includes the web app URL
   - Check API CORS configuration

### Permission Denied Errors

Re-run the permission setup:

```powershell
$PROJECT_NUMBER = gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)'

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID `
    --member="serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" `
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID `
    --member="serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" `
    --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID `
    --member="serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" `
    --role="roles/artifactregistry.writer"
```

---

## Security Best Practices

1. **Never commit `.gcp-config`** - It contains sensitive information
2. **Use Secret Manager** for production secrets (optional upgrade)
3. **Enable Cloud Armor** for DDoS protection (optional)
4. **Set up monitoring** with Cloud Monitoring
5. **Enable audit logs** for compliance

---

## Next Steps

- Set up **custom domains** for your Cloud Run services
- Configure **Cloud CDN** for better performance
- Set up **monitoring and alerts**
- Configure **backup schedules** for Cloud SQL
- Set up **staging environment** (create another trigger for `develop` branch)

---

## Summary Checklist

- [ ] Installed and configured gcloud CLI
- [ ] Created/selected GCP project
- [ ] Ran setup script or manually created resources
- [ ] `.gcp-config` file created with all values
- [ ] Connected GitHub repository to Cloud Build
- [ ] Created build trigger with substitution variables
- [ ] Pushed to main branch and triggered first build
- [ ] Verified deployment in Cloud Run console
- [ ] Tested API and Web URLs
- [ ] Ran database migrations
- [ ] Verified CI/CD is working (push → deploy)

---

## Support

If you encounter issues:

1. Check the **Troubleshooting** section above
2. Review **Cloud Build logs** and **Cloud Run logs**
3. Verify all **substitution variables** are correct
4. Ensure all **APIs are enabled**
5. Check **IAM permissions** for Cloud Build service account

---

**Congratulations!** Your application is now hosted on GCP with automatic CI/CD! 🚀
