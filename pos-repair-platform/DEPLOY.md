# Deploy to Google Cloud (GitHub → Cloud Run)

Deploy the POS Repair Platform to **Google Cloud Run** so that **every push to your GitHub `main` branch** automatically builds and deploys the app.

---

## Prerequisites

- [Google Cloud account](https://console.cloud.google.com) with billing enabled  
- [gcloud CLI](https://cloud.google.com/sdk/docs/install) installed and logged in  
- This repo pushed to a **GitHub** repository  

---

## 1. Create a new GCP project and resources

From the **repo root** (`pos-repair-platform`):

```bash
chmod +x scripts/setup-gcp-from-scratch.sh
./scripts/setup-gcp-from-scratch.sh
```

When prompted:

- **Project ID**: Use an existing GCP project ID, or type `new` to create one (you’ll need a billing account).
- **PostgreSQL**: Set root and app user passwords when asked.

The script will:

- Create or use a GCP project  
- Enable APIs (Cloud Run, Cloud Build, Artifact Registry, etc.)  
- Create Artifact Registry, VPC connector, Memorystore Redis, Cloud SQL PostgreSQL  
- Grant Cloud Build the right roles  
- Write **`.gcp-config`** (do **not** commit this file; it’s in `.gitignore`)  

---

## 2. Connect GitHub to Cloud Build

1. Open: **https://console.cloud.google.com/cloud-build/triggers?project=YOUR_PROJECT_ID**  
   (Use the project ID from step 1.)

2. Click **“Connect Repository”**.

3. Choose **“GitHub (Cloud Build GitHub App)”** and sign in / authorize.

4. Select the **GitHub org** and **repository** that contains this code.

5. Click **“Connect”**.

---

## 3. Create a build trigger (push → deploy)

1. In Cloud Build → Triggers, click **“Create Trigger”**.

2. Set:

   - **Name**: `deploy-main`
   - **Event**: **Push to a branch**
   - **Source**: The repo you just connected  
   - **Branch**: `^main$`  
   - **Configuration**: **Cloud Build configuration file**  
   - **Location**: **Repository**  
   - **Cloud Build configuration file**: `cloudbuild.yaml`  

3. Expand **“Substitution variables”** and add (replace placeholders with values from **`.gcp-config`**):

   | Variable                | Example / source                          |
   |-------------------------|-------------------------------------------|
   | `_SQL_CONNECTION_NAME`  | `CONNECTION_NAME` from `.gcp-config`      |
   | `_VPC_CONNECTOR`        | `pos-repair-connector` (or your connector)|
   | `_DATABASE_URL`         | `postgresql://USER:PASSWORD@/DB?host=/cloudsql/CONNECTION_NAME` (use `SQL_USER`, `SQL_PASSWORD`, `SQL_DATABASE`, `CONNECTION_NAME`) |
   | `_REDIS_HOST`           | `REDIS_IP` from `.gcp-config`             |
   | `_JWT_SECRET`           | `JWT_SECRET` from `.gcp-config`           |
   | `_FRONTEND_URL`         | `https://pos-repair-web-PROJECT_NUMBER.us-central1.run.app,https://pos-repair-owner-PROJECT_NUMBER.us-central1.run.app` (use `PROJECT_NUMBER` from `.gcp-config`) |

   **Example** (adjust to your `.gcp-config`):

   - `_SQL_CONNECTION_NAME` = `my-project:us-central1:pos-repair-postgres`  
   - `_VPC_CONNECTOR` = `pos-repair-connector`  
   - `_DATABASE_URL` = `postgresql://posrepair_user:YOUR_PASSWORD@/pos_repair_platform?host=/cloudsql/my-project:us-central1:pos-repair-postgres`  
   - `_REDIS_HOST` = `10.x.x.x` (Memorystore IP)  
   - `_JWT_SECRET` = (value from `.gcp-config`)  
   - `_FRONTEND_URL` = `https://pos-repair-web-123456789.us-central1.run.app,https://pos-repair-owner-123456789.us-central1.run.app`  

4. Click **“Create”**.

---

## 4. First deploy (trigger a build)

Trigger the first deployment by pushing to `main`:

```bash
git add .
git commit -m "Setup GCP deploy"
git push origin main
```

Cloud Build will:

1. Build API and Web Docker images  
2. Push them to Artifact Registry  
3. Deploy to Cloud Run (`pos-repair-api`, `pos-repair-web`)  
4. Shift traffic to the new revisions  

You can watch progress: **Cloud Build → History** in the GCP console.

---

## 5. Your live URLs

After the first successful build:

- **API**: `https://pos-repair-api-PROJECT_NUMBER.us-central1.run.app`  
- **Web**: `https://pos-repair-web-PROJECT_NUMBER.us-central1.run.app`  

`PROJECT_NUMBER` is in `.gcp-config` (or run  
`gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)'`).

---

## Push = deploy

From now on, **every push to `main`** will:

1. Trigger the Cloud Build  
2. Build new images  
3. Deploy to Cloud Run  
4. Update traffic to the new revision  

No extra manual deploy steps.

---

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| Build fails | Cloud Build → History → open the build → logs. Confirm **substitution variables** match `.gcp-config` and that **APIs** are enabled. |
| “Permission denied” | Re-run the setup script so Cloud Build has `roles/run.admin`, `roles/iam.serviceAccountUser`, `roles/artifactregistry.writer`. |
| API 502 / crashes | Cloud Run → **pos-repair-api** → Logs. Verify `_DATABASE_URL`, `_REDIS_HOST`, `_JWT_SECRET`, and VPC/Cloud SQL connector. |
| Web app can’t reach API | `NEXT_PUBLIC_API_URL` in `cloudbuild.yaml` uses `PROJECT_NUMBER`. Ensure it matches your project and that the API URL is correct. |

---

## Summary

1. Run `./scripts/setup-gcp-from-scratch.sh` → creates project + resources, writes `.gcp-config`.  
2. Connect the GitHub repo in **Cloud Build → Triggers**.  
3. Create trigger on `main` using `cloudbuild.yaml` and the **substitution variables** above.  
4. Push to `main` → automatic deploy.  

Do **not** commit `.gcp-config`; it holds secrets.
