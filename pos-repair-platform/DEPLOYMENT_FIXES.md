# Deployment Fixes Applied

## Critical Issues Fixed

### 1. ✅ PROJECT_NUMBER Variable Fix
**Issue:** `PROJECT_NUMBER` is not a built-in Cloud Build substitution variable.

**Fix:** Changed all references from `${PROJECT_NUMBER}` to `${_PROJECT_NUMBER}` in `cloudbuild.yaml`.

**Action Required:** Add `_PROJECT_NUMBER=233232647471` to your Cloud Build trigger substitution variables.

### 2. ✅ FRONTEND_URL Semicolon Fix
**Issue:** gcloud `--set-env-vars` treats commas as separators, breaking comma-separated URLs.

**Fix:** 
- Updated API to split on both commas and semicolons: `FRONTEND_URL.split(/[,;]/)`
- Updated all documentation to use semicolons
- Updated trigger config to use semicolons

**Action Required:** Ensure your Cloud Build trigger has `_FRONTEND_URL` with semicolons:
```
https://pos-repair-web-233232647471.us-central1.run.app;https://pos-repair-owner-233232647471.us-central1.run.app
```

### 3. ✅ Port Configuration
**Status:** Verified - Next.js standalone builds automatically read `PORT` environment variable. Cloud Run sets `PORT=8080`, which will be used correctly.

### 4. ✅ Environment Variables
All environment variables are correctly configured:
- API: `DATABASE_URL`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `JWT_SECRET`, `NODE_ENV`, `PORT`, `FRONTEND_URL`
- Web/Owner: `NEXT_PUBLIC_API_URL`, `NODE_ENV`, `PORT`

## Required Cloud Build Trigger Substitution Variables

Make sure your trigger has ALL of these:

| Variable | Value |
|----------|-------|
| `_SQL_CONNECTION_NAME` | `repair-pos-485101:us-central1:pos-repair-postgres` |
| `_VPC_CONNECTOR` | `pos-repair-connector` |
| `_DATABASE_URL` | `postgresql://posrepair_user:yDk428pJlBToNjZV@/pos_repair_platform?host=/cloudsql/repair-pos-485101:us-central1:pos-repair-postgres` |
| `_REDIS_HOST` | `10.75.215.211` |
| `_JWT_SECRET` | `IWFKzVLkERlDJ0iX1caYCvpmqMBuxSfj` |
| `_FRONTEND_URL` | `https://pos-repair-web-233232647471.us-central1.run.app;https://pos-repair-owner-233232647471.us-central1.run.app` |
| `_PROJECT_NUMBER` | `233232647471` ⚠️ **NEW - ADD THIS** |

## Next Steps

1. **Update Cloud Build Trigger:**
   - Add `_PROJECT_NUMBER=233232647471` to substitution variables
   - Verify `_FRONTEND_URL` uses semicolons (not commas)

2. **Ensure Cloud SQL is Ready:**
   ```powershell
   gcloud sql instances list --project=repair-pos-485101
   ```
   - Should show `RUNNABLE` state
   - If not, wait for it to finish creating

3. **Complete Cloud SQL Setup (if needed):**
   ```powershell
   gcloud sql databases create pos_repair_platform --instance=pos-repair-postgres --project=repair-pos-485101
   gcloud sql users create posrepair_user --instance=pos-repair-postgres --password="yDk428pJlBToNjZV" --project=repair-pos-485101
   ```

4. **Trigger Deployment:**
   ```powershell
   git push origin main
   ```

## Verification Checklist

- [ ] `_PROJECT_NUMBER` added to trigger
- [ ] `_FRONTEND_URL` uses semicolons
- [ ] Cloud SQL instance is `RUNNABLE`
- [ ] Database and user exist in Cloud SQL
- [ ] All other substitution variables are set
- [ ] Code changes committed and pushed
