# GCP Quick Start Checklist

Use this as a quick reference while following the detailed guide in `GCP_SETUP_GUIDE.md`.

## Prerequisites
- [ ] Google Cloud account with billing enabled
- [ ] gcloud CLI installed (`gcloud --version`)
- [ ] GitHub repository with your code
- [ ] Git Bash or WSL (for bash scripts)

## Step 1: Setup GCP Resources

**Option A: Automated (Recommended)**
```bash
cd pos-repair-platform
chmod +x scripts/setup-gcp-from-scratch.sh
./scripts/setup-gcp-from-scratch.sh
```

**Option B: Manual**
- Follow Step 2 in `GCP_SETUP_GUIDE.md`

**Result:** `.gcp-config` file created with all values

## Step 2: Connect GitHub

1. Go to: https://console.cloud.google.com/cloud-build/triggers
2. Click "Connect Repository"
3. Select "GitHub (Cloud Build GitHub App)"
4. Authorize and select your repo

## Step 3: Create Trigger

1. Click "Create Trigger"
2. Name: `deploy-main`
3. Event: Push to branch `^main$`
4. Config file: `cloudbuild.yaml`
5. Add substitution variables (from `.gcp-config`):

| Variable | Source |
|----------|--------|
| `_SQL_CONNECTION_NAME` | `CONNECTION_NAME` |
| `_VPC_CONNECTOR` | `pos-repair-connector` |
| `_DATABASE_URL` | `postgresql://SQL_USER:SQL_PASSWORD@/SQL_DATABASE?host=/cloudsql/CONNECTION_NAME` |
| `_REDIS_HOST` | `REDIS_IP` |
| `_JWT_SECRET` | `JWT_SECRET` |
| `_FRONTEND_URL` | `https://pos-repair-web-PROJECT_NUMBER.us-central1.run.app,https://pos-repair-owner-PROJECT_NUMBER.us-central1.run.app` |

## Step 4: Deploy

```bash
git push origin main
```

Monitor: https://console.cloud.google.com/cloud-build/builds

## Step 5: Verify

- API: `https://pos-repair-api-PROJECT_NUMBER.us-central1.run.app`
- Web: `https://pos-repair-web-PROJECT_NUMBER.us-central1.run.app`

## Common Issues

| Issue | Solution |
|-------|----------|
| Build fails | Check substitution variables match `.gcp-config` |
| Permission denied | Re-run permission setup (Step 2.3 in guide) |
| API 502 | Check Cloud Run logs, verify env vars |
| Can't connect to DB | Verify `_DATABASE_URL` format |

## Important Files

- `.gcp-config` - **DO NOT COMMIT** (contains secrets)
- `cloudbuild.yaml` - CI/CD configuration
- `GCP_SETUP_GUIDE.md` - Detailed instructions
