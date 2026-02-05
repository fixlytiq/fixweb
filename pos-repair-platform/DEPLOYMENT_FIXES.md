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

## Senior Dev Checklist (Fixlytiq)

### 1. Initial Deploy – No `--no-traffic`
- **Done:** We do **not** use `--no-traffic` in `cloudbuild.yaml`. First deploy sends 100% traffic to the new revision.
- If you add `--no-traffic` later for staged rollouts, use it only when the service already has at least one revision.

### 2. VPC Connector & Egress
- **Region:** Connector must be in the same region as Cloud Run (`us-central1`). Our connector: `pos-repair-connector`.
- **Configured in deploy:** API deploy uses `--vpc-connector` and `--vpc-egress=all-traffic` so the API can reach:
  - **Private IPs:** Cloud SQL (if using private IP) and Memorystore Redis.
  - **Public internet:** Twilio (SMS) and SMTP (email) for notifications.
- If you ever switch to **private-only** egress (no Twilio/SMTP), use `--vpc-egress=private-ranges-only`.

### 3. Database & Migrations
- **Entrypoint:** The API Docker image uses `docker-entrypoint.sh`, which runs `prisma migrate deploy` before starting the app. Schema is ready before the process listens.
- **start:prod:** `apps/api/package.json` has `"start:prod": "prisma migrate deploy --schema=prisma/schema.prisma && node dist/main"` for non-Docker production runs.
- **Connection:** We use **Cloud SQL Proxy** (Unix socket) via `--add-cloudsql-instances` and `DATABASE_URL` with `?host=/cloudsql/PROJECT:REGION:INSTANCE`. Alternative: private IP in VPC with `postgresql://user:password@PRIVATE_IP:5432/dbname` and no `--add-cloudsql-instances` (connector still needed for Redis).

### 4. Build-Time Env (Next.js)
- **Web & Owner:** Both Docker builds receive `--build-arg NEXT_PUBLIC_API_URL=https://pos-repair-api-${_PROJECT_NUMBER}.us-central1.run.app` in `cloudbuild.yaml`, so the frontend does not call `localhost:3000` in production.
- **Trigger:** Ensure `_PROJECT_NUMBER` is set in the Cloud Build trigger so the URL resolves correctly.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|--------|----------------|-----|
| **Cloud Build fails at Deploy** | IAM | Grant Cloud Build Service Account: **Cloud Run Admin**, **Service Account User**. |
| **Cloud Run "Service Unavailable"** | API crashing on start | Check Cloud Run logs. Often: bad `DATABASE_URL`, DB not ready, or missing `JWT_SECRET`. |
| **Web/Owner 404 or wrong API URL** | Build args | Confirm `NEXT_PUBLIC_API_URL` was passed in the Docker build step and `_PROJECT_NUMBER` is set in the trigger. |
| **Redis connection timeout** | VPC / egress | API must use the VPC connector; ensure `--vpc-connector` and `--vpc-egress=all-traffic` (or `private-ranges-only` if Redis-only). |

---

## Verification Checklist

- [ ] `_PROJECT_NUMBER` added to trigger
- [ ] `_FRONTEND_URL` uses semicolons
- [ ] Cloud SQL instance is `RUNNABLE`
- [ ] Database and user exist in Cloud SQL
- [ ] All other substitution variables are set
- [ ] Code changes committed and pushed
- [ ] Cloud Build SA has Cloud Run Admin + Service Account User
- [ ] VPC connector is in `us-central1` and matches `_VPC_CONNECTOR`
