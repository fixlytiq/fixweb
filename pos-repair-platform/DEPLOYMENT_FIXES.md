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
| `_DATABASE_URL` | See "DATABASE_URL (Brute Force)" below. No `:5432` after localhost. |
| `_REDIS_HOST` | `10.75.215.211` |
| `_JWT_SECRET` | `IWFKzVLkERlDJ0iX1caYCvpmqMBuxSfj` |
| `_FRONTEND_URL` | `https://pos-repair-web-233232647471.us-central1.run.app;https://pos-repair-owner-233232647471.us-central1.run.app` |
| `_PROJECT_NUMBER` | `233232647471` ⚠️ **NEW - ADD THIS** |

## DATABASE_URL (Brute Force) – Cloud SQL Unix socket

If Prisma still reports a path with `:5432` at the end, the running container may be using an old env/secret ("ghost" variable). Use one of these **exact** formats (no `:5432` after `localhost`):

**Use URL-encoded host param** so Prisma does not append `:5432` to the path (fixes `.s.PGSQL.5432:5432` error):
```
postgresql://posrepair_user:Pandu%40-%2A123@localhost/pos_repair_platform?host=%2Fcloudsql%2Frepair-pos-485101%3Aus-central1%3Apos-repair-postgres
```
(`%2F` = `/`, `%3A` = `:`). Generate your own: `node pos-repair-platform/scripts/encode-cloudsql-database-url.js USER PASS DB`

**If you use Secret Manager:** Create a **new version** of the `DATABASE_URL` secret with one of the strings above, then in Cloud Run ensure the service uses the **latest** version of that secret. Old secret versions can cause the "ghost" env.

**Verify Cloud SQL mount:** If the app says "Can't reach database", the `/cloudsql/` directory may be empty. Check:
```bash
gcloud run services describe pos-repair-api --region=us-central1 --project=repair-pos-485101 --format="value(spec.template.metadata.annotations['run.googleapis.com/cloudsql-instances'])"
```
If this returns empty, run:
```bash
gcloud run services update pos-repair-api --region=us-central1 --project=repair-pos-485101 --add-cloudsql-instances repair-pos-485101:us-central1:pos-repair-postgres
```

**Startup diagnostic:** Set `DEBUG_DB=1` on the Cloud Run service to log (redacted) DATABASE_URL and whether the socket path exists. Check logs after deploy.

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
- **Pipeline:** Each build deploys the `pos-repair-migrate` job and runs it before deploying the API. The job uses the same **private IP** `DATABASE_URL` as the API (`postgresql://user:encoded_password@10.221.0.3:5432/pos_repair_platform`). The entrypoint URL-decodes the password for the `psql` readiness check.
- **"Store table does not exist":** Migrations have not been applied. Ensure `_DATABASE_URL` in the Cloud Build trigger is the **private IP** URL, then push to trigger a build so the migrate job runs with the latest image. To run the job again without a full build:
  ```powershell
  gcloud run jobs execute pos-repair-migrate --region=us-central1 --project=repair-pos-485101 --wait
  ```
- **Manual sync (from your machine):** Use Cloud SQL Proxy and run migrations from `pos-repair-platform`:
  - Start proxy: `cloud_sql_proxy -instances=repair-pos-485101:us-central1:pos-repair-postgres=tcp:5432`
  - Set `DATABASE_URL` to `postgresql://posrepair_user:YOUR_PASSWORD@127.0.0.1:5432/pos_repair_platform` (password must match the Cloud SQL user; if it contains `@` or `*`, URL-encode as `%40` / `%2A`).
  - **Windows:** `.\scripts\run-migrations.ps1`  
  - **Bash:** `./scripts/run-migrations.sh`
- **Connection:** We use **private IP** in VPC: `postgresql://posrepair_user:pandu%40-%2A123@10.221.0.3:5432/pos_repair_platform`. No `--add-cloudsql-instances`; VPC connector is used for Redis and DB.

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
