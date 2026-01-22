# Deploy to GCP - Quick Steps

## Current Status
- ✅ All GCP resources created (Cloud SQL still creating - 5-10 min)
- ✅ All applications configured (API, Web, Owner)
- ✅ cloudbuild.yaml updated and committed
- ⏳ Cloud SQL: Still creating

## Step 1: Complete Cloud SQL Setup

Once Cloud SQL is ready, run:

```powershell
cd c:\fixweb-1\pos-repair-platform

# Check if ready
gcloud sql instances list --project=repair-pos-485101

# When it shows RUNNABLE, complete setup:
$PROJECT_ID = "repair-pos-485101"
$SQL_INSTANCE = "pos-repair-postgres"
$SQL_DATABASE = "pos_repair_platform"
$SQL_USER = "posrepair_user"
$DB_PASSWORD = "yDk428pJlBToNjZV"

gcloud sql databases create $SQL_DATABASE --instance=$SQL_INSTANCE --project=$PROJECT_ID
gcloud sql users create $SQL_USER --instance=$SQL_INSTANCE --password=$DB_PASSWORD --project=$PROJECT_ID
```

## Step 2: Connect GitHub to Cloud Build

1. **Open Cloud Build Triggers:**
   https://console.cloud.google.com/cloud-build/triggers?project=repair-pos-485101

2. **Click "Connect Repository"**

3. **Select "GitHub (Cloud Build GitHub App)"**

4. **Authorize and select your repository**

5. **Click "Connect"**

## Step 3: Create Build Trigger

1. **Click "Create Trigger"**

2. **Basic Settings:**
   - Name: `deploy-main`
   - Description: `Deploy all apps to Cloud Run on push to main`

3. **Event Configuration:**
   - Event: **Push to a branch**
   - Source: Your connected repository
   - Branch: `^main$`

4. **Configuration:**
   - Type: **Cloud Build configuration file**
   - Location: **Repository**
   - Cloud Build configuration file: `cloudbuild.yaml`

5. **Substitution Variables** (expand this section and add):

   | Variable | Value |
   |----------|-------|
   | `_SQL_CONNECTION_NAME` | `repair-pos-485101:us-central1:pos-repair-postgres` |
   | `_VPC_CONNECTOR` | `pos-repair-connector` |
   | `_DATABASE_URL` | `postgresql://posrepair_user:yDk428pJlBToNjZV@/pos_repair_platform?host=/cloudsql/repair-pos-485101:us-central1:pos-repair-postgres` |
   | `_REDIS_HOST` | `10.75.215.211` |
   | `_JWT_SECRET` | `IWFKzVLkERlDJ0iX1caYCvpmqMBuxSfj` |
   | `_FRONTEND_URL` | `https://pos-repair-web-233232647471.us-central1.run.app,https://pos-repair-owner-233232647471.us-central1.run.app` |

6. **Click "Create"**

## Step 4: Push to Deploy!

```powershell
git push origin main
```

This will trigger the build and deploy all three applications!

## Step 5: Monitor Deployment

Watch the build progress:
https://console.cloud.google.com/cloud-build/builds?project=repair-pos-485101

## Your Application URLs (after deployment)

- **API**: https://pos-repair-api-233232647471.us-central1.run.app
- **Web**: https://pos-repair-web-233232647471.us-central1.run.app
- **Owner**: https://pos-repair-owner-233232647471.us-central1.run.app

## Important Notes

⚠️ **Cloud SQL must be RUNNABLE before deployment succeeds!**

If deployment fails:
1. Check Cloud SQL status: `gcloud sql instances list --project=repair-pos-485101`
2. Complete Cloud SQL setup if needed (Step 1)
3. Re-run the build or push again
