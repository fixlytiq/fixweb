# Next Steps to Complete Deployment

## Current Status ✅

- ✅ GCP Project configured: `repair-pos-485101`
- ✅ APIs enabled
- ✅ Cloud Build permissions granted
- ✅ Artifact Registry created
- ✅ VPC Network and Connector created
- ✅ Redis (Memorystore) created and ready: `10.75.215.211`
- ✅ `.gcp-config` file created with all configuration
- ⏳ Cloud SQL PostgreSQL: Still creating (takes 5-10 minutes)

## Step 1: Complete Cloud SQL Setup

Once Cloud SQL is ready, run:

```powershell
cd c:\fixweb-1\pos-repair-platform
.\scripts\finish-cloud-sql-setup.ps1
```

Or check status manually:
```powershell
gcloud sql instances list --project=repair-pos-485101
```

When it shows `RUNNABLE`, run the script above.

## Step 2: Connect GitHub Repository

1. Go to: https://console.cloud.google.com/cloud-build/triggers?project=repair-pos-485101
2. Click **"Connect Repository"**
3. Select **"GitHub (Cloud Build GitHub App)"**
4. Click **"Install Google Cloud Build"** if needed
5. Sign in to GitHub and authorize
6. Select your **GitHub organization** and **repository**
7. Click **"Connect"**

## Step 3: Create Build Trigger

1. In Cloud Build → Triggers, click **"Create Trigger"**
2. Configure:
   - **Name**: `deploy-main`
   - **Description**: `Deploy to Cloud Run on push to main`
   - **Event**: Push to a branch
   - **Source**: Your connected repository
   - **Branch**: `^main$`
   - **Configuration**: Cloud Build configuration file
   - **Location**: Repository
   - **Cloud Build configuration file**: `cloudbuild.yaml`

3. **Add Substitution Variables** (expand the section):

   | Variable Name | Value |
   |--------------|-------|
   | `_SQL_CONNECTION_NAME` | `repair-pos-485101:us-central1:pos-repair-postgres` |
   | `_VPC_CONNECTOR` | `pos-repair-connector` |
   | `_DATABASE_URL` | `postgresql://posrepair_user:yDk428pJlBToNjZV@/pos_repair_platform?host=/cloudsql/repair-pos-485101:us-central1:pos-repair-postgres` |
   | `_REDIS_HOST` | `10.75.215.211` |
   | `_JWT_SECRET` | `IWFKzVLkERlDJ0iX1caYCvpmqMBuxSfj` |
   | `_FRONTEND_URL` | `https://pos-repair-web-233232647471.us-central1.run.app;https://pos-repair-owner-233232647471.us-central1.run.app` (semicolons, not commas) |

4. Click **"Create"**

## Step 4: Deploy!

Push to your `main` branch to trigger the first deployment:

```powershell
git add .
git commit -m "Setup GCP deployment"
git push origin main
```

Monitor the build at: https://console.cloud.google.com/cloud-build/builds?project=repair-pos-485101

## Step 5: Run Database Migrations

After the first deployment, run migrations:

```powershell
# Option 1: Using Cloud SQL Proxy (recommended)
# Install: https://cloud.google.com/sql/docs/postgres/connect-admin-proxy
cloud-sql-proxy repair-pos-485101:us-central1:pos-repair-postgres

# Then in another terminal:
cd apps/api
npx prisma migrate deploy
```

## Your URLs (after deployment)

- **API**: https://pos-repair-api-233232647471.us-central1.run.app
- **Web**: https://pos-repair-web-233232647471.us-central1.run.app

## Troubleshooting

If build fails:
- Check Cloud Build logs
- Verify substitution variables match `.gcp-config`
- Ensure Cloud SQL is `RUNNABLE` before deploying

If API returns 502:
- Check Cloud Run logs
- Verify database connection string format
- Ensure VPC connector is working

## Summary

1. ✅ GCP resources created (waiting for Cloud SQL)
2. ⏳ Complete Cloud SQL setup (run `finish-cloud-sql-setup.ps1`)
3. ⏳ Connect GitHub repository
4. ⏳ Create build trigger with substitution variables
5. ⏳ Push to main → automatic deploy!
