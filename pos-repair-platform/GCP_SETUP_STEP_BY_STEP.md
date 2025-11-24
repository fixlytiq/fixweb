# GCP Setup - Step by Step Guide

This is a complete step-by-step guide to set up your POS Repair Platform on Google Cloud Platform.

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] Google Cloud Platform account (sign up at https://cloud.google.com/)
- [ ] Billing enabled on your GCP account
- [ ] `gcloud` CLI installed (see Step 1)
- [ ] Docker installed on your local machine
- [ ] Basic knowledge of terminal/command line

---

## Step 1: Install Google Cloud SDK

### For Linux/Mac:

```bash
# Download and install
curl https://sdk.cloud.google.com | bash

# Restart your shell or run:
exec -l $SHELL

# Initialize gcloud
gcloud init
```

### For Windows:

1. Download the installer from: https://cloud.google.com/sdk/docs/install
2. Run the installer and follow the prompts
3. Open a new terminal/command prompt

### Verify Installation:

```bash
gcloud --version
```

You should see output showing the version of gcloud, kubectl, and other tools.

---

## Step 2: Create a GCP Project

### Option A: Using gcloud CLI

```bash
# Set your project ID (choose a unique name)
export PROJECT_ID="pos-repair-platform-$(date +%s)"

# Create the project
gcloud projects create $PROJECT_ID --name="POS Repair Platform"

# Set it as your active project
gcloud config set project $PROJECT_ID

# Enable billing (you'll need to select a billing account)
gcloud billing projects link $PROJECT_ID --billing-account=YOUR_BILLING_ACCOUNT_ID
```

### Option B: Using GCP Console

1. Go to https://console.cloud.google.com/
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter project name: "POS Repair Platform"
5. Click "Create"
6. Wait for the project to be created
7. Select the project from the dropdown

### Set Your Project ID:

```bash
# Replace with your actual project ID from the console
export PROJECT_ID="your-project-id-here"
gcloud config set project $PROJECT_ID
```

---

## Step 3: Enable Required APIs

Run this command to enable all necessary APIs:

```bash
gcloud services enable \
    redis.googleapis.com \
    sqladmin.googleapis.com \
    run.googleapis.com \
    container.googleapis.com \
    cloudbuild.googleapis.com \
    vpcaccess.googleapis.com \
    compute.googleapis.com
```

Wait for all APIs to be enabled (this may take 1-2 minutes).

---

## Step 4: Set Up Region and Zone

```bash
# Set your preferred region (choose closest to you)
export REGION="us-central1"  # Options: us-central1, us-east1, europe-west1, asia-southeast1
export ZONE="${REGION}-a"    # e.g., us-central1-a

# Verify
echo "Region: $REGION"
echo "Zone: $ZONE"
```

**Common Regions:**
- `us-central1` - Iowa, USA
- `us-east1` - South Carolina, USA
- `europe-west1` - Belgium
- `asia-southeast1` - Singapore

---

## Step 5: Create Memorystore Redis Instance

### 5.1 Create the Instance

```bash
# Set instance details
export INSTANCE_ID="pos-repair-redis"
export MEMORY_SIZE_GB=1  # Start with 1GB, can scale later

# Create Memorystore instance (takes 5-10 minutes)
gcloud redis instances create $INSTANCE_ID \
    --size=$MEMORY_SIZE_GB \
    --region=$REGION \
    --redis-version=redis_7_0 \
    --tier=basic \
    --project=$PROJECT_ID
```

**Note:** This step takes 5-10 minutes. Be patient!

### 5.2 Get Redis Connection Details

```bash
# Get the Redis IP address
export REDIS_IP=$(gcloud redis instances describe $INSTANCE_ID \
    --region=$REGION \
    --format="value(host)")

# Get the port (usually 6379)
export REDIS_PORT=$(gcloud redis instances describe $INSTANCE_ID \
    --region=$REGION \
    --format="value(port)")

# Display the information
echo "Redis IP: $REDIS_IP"
echo "Redis Port: $REDIS_PORT"
```

**Save these values!** You'll need them later.

---

## Step 6: Create Cloud SQL PostgreSQL Instance

### 6.1 Create the Instance

```bash
# Set instance details
export SQL_INSTANCE="pos-repair-postgres"

# Set a strong root password (save this securely!)
export ROOT_PASSWORD="YourSecurePassword123!"

# Create Cloud SQL instance (takes 5-10 minutes)
gcloud sql instances create $SQL_INSTANCE \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=$REGION \
    --root-password="$ROOT_PASSWORD" \
    --storage-type=SSD \
    --storage-size=10GB \
    --backup-start-time=03:00 \
    --enable-bin-log
```

**Note:** This also takes 5-10 minutes.

### 6.2 Create Database

```bash
# Create the database
gcloud sql databases create pos_repair_platform \
    --instance=$SQL_INSTANCE
```

### 6.3 Create Database User

```bash
# Set user details
export DB_USER="posrepair_user"
export DB_PASSWORD="YourSecureDBPassword123!"

# Create user
gcloud sql users create $DB_USER \
    --instance=$SQL_INSTANCE \
    --password="$DB_PASSWORD"
```

### 6.4 Get Connection Name

```bash
# Get connection name (needed for Cloud Run)
export CONNECTION_NAME=$(gcloud sql instances describe $SQL_INSTANCE \
    --format="value(connectionName)")

echo "Connection Name: $CONNECTION_NAME"
```

**Save this value!**

---

## Step 7: Create VPC Connector (for Cloud Run)

```bash
# Create VPC connector (allows Cloud Run to access Memorystore)
gcloud compute networks vpc-access connectors create pos-repair-connector \
    --region=$REGION \
    --subnet-project=$PROJECT_ID \
    --subnet=default \
    --min-instances=2 \
    --max-instances=3 \
    --machine-type=e2-micro
```

This takes 2-3 minutes.

---

## Step 8: Set Up Authentication

### 8.1 Create Service Account (Optional but Recommended)

```bash
# Create service account
gcloud iam service-accounts create pos-repair-sa \
    --display-name="POS Repair Platform Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:pos-repair-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:pos-repair-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/redis.editor"
```

### 8.2 Configure Application Default Credentials

```bash
gcloud auth application-default login
```

This opens a browser window for authentication.

---

## Step 9: Prepare Docker Images

### 9.1 Configure Docker for GCR

```bash
# Configure Docker to use gcloud as credential helper
gcloud auth configure-docker
```

### 9.2 Build API Image

```bash
# Navigate to project root
cd /home/omprakash/fixwebone/fixweb/pos-repair-platform

# Build the API image
docker build -t gcr.io/$PROJECT_ID/pos-repair-api:latest \
    -f apps/api/Dockerfile .
```

### 9.3 Build Web Image

```bash
# Build the Web image (replace with your API URL)
docker build -t gcr.io/$PROJECT_ID/pos-repair-web:latest \
    -f apps/web/Dockerfile \
    --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com .
```

**Note:** Replace `https://api.yourdomain.com` with your actual API URL after deployment.

### 9.4 Push Images to Google Container Registry

```bash
# Push API image
docker push gcr.io/$PROJECT_ID/pos-repair-api:latest

# Push Web image
docker push gcr.io/$PROJECT_ID/pos-repair-web:latest
```

---

## Step 10: Deploy to Cloud Run

### 10.1 Deploy API Service

```bash
# Deploy API
gcloud run deploy pos-repair-api \
    --image gcr.io/$PROJECT_ID/pos-repair-api:latest \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --vpc-connector pos-repair-connector \
    --add-cloudsql-instances $CONNECTION_NAME \
    --set-env-vars "DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@/pos_repair_platform?host=/cloudsql/$CONNECTION_NAME" \
    --set-env-vars "REDIS_HOST=$REDIS_IP" \
    --set-env-vars "REDIS_PORT=$REDIS_PORT" \
    --set-env-vars "REDIS_PASSWORD=" \
    --set-env-vars "NODE_ENV=production" \
    --set-env-vars "PORT=3000" \
    --set-secrets "JWT_SECRET=JWT_SECRET:latest" \
    --set-secrets "TWILIO_ACCOUNT_SID=TWILIO_ACCOUNT_SID:latest" \
    --set-secrets "TWILIO_AUTH_TOKEN=TWILIO_AUTH_TOKEN:latest" \
    --set-secrets "TWILIO_PHONE_NUMBER=TWILIO_PHONE_NUMBER:latest" \
    --set-secrets "SMTP_HOST=SMTP_HOST:latest" \
    --set-secrets "SMTP_USER=SMTP_USER:latest" \
    --set-secrets "SMTP_PASSWORD=SMTP_PASSWORD:latest" \
    --set-secrets "SMTP_FROM=SMTP_FROM:latest" \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 1 \
    --max-instances 10
```

**Note:** You'll need to create secrets first (see Step 11).

### 10.2 Get API URL

```bash
# Get the API URL
export API_URL=$(gcloud run services describe pos-repair-api \
    --region=$REGION \
    --format="value(status.url)")

echo "API URL: $API_URL"
```

### 10.3 Deploy Web Service

```bash
# Deploy Web (use the API URL from above)
gcloud run deploy pos-repair-web \
    --image gcr.io/$PROJECT_ID/pos-repair-web:latest \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars "NEXT_PUBLIC_API_URL=$API_URL" \
    --set-env-vars "NODE_ENV=production" \
    --set-env-vars "PORT=3001" \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10
```

### 10.4 Get Web URL

```bash
# Get the Web URL
export WEB_URL=$(gcloud run services describe pos-repair-web \
    --region=$REGION \
    --format="value(status.url)")

echo "Web URL: $WEB_URL"
```

---

## Step 11: Create Secrets (Alternative to Environment Variables)

If you prefer using Secret Manager instead of environment variables:

### 11.1 Create Secrets

```bash
# JWT Secret
echo -n "your-jwt-secret-key" | gcloud secrets create JWT_SECRET --data-file=-

# Twilio
echo -n "your-twilio-sid" | gcloud secrets create TWILIO_ACCOUNT_SID --data-file=-
echo -n "your-twilio-token" | gcloud secrets create TWILIO_AUTH_TOKEN --data-file=-
echo -n "+1234567890" | gcloud secrets create TWILIO_PHONE_NUMBER --data-file=-

# SMTP
echo -n "smtp.gmail.com" | gcloud secrets create SMTP_HOST --data-file=-
echo -n "your-email@gmail.com" | gcloud secrets create SMTP_USER --data-file=-
echo -n "your-app-password" | gcloud secrets create SMTP_PASSWORD --data-file=-
echo -n "your-email@gmail.com" | gcloud secrets create SMTP_FROM --data-file=-
```

### 11.2 Grant Access to Service Account

```bash
# Grant access to secrets
gcloud secrets add-iam-policy-binding JWT_SECRET \
    --member="serviceAccount:pos-repair-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

---

## Step 12: Run Database Migrations

### 12.1 Connect to Cloud SQL

```bash
# Get the public IP (if needed for local connection)
gcloud sql instances describe $SQL_INSTANCE \
    --format="value(ipAddresses[0].ipAddress)"
```

### 12.2 Run Migrations from Local Machine

```bash
# Set DATABASE_URL
export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$SQL_IP:5432/pos_repair_platform"

# Navigate to API directory
cd apps/api

# Run migrations
npx prisma migrate deploy
```

### 12.3 Or Run Migrations from Cloud Run

You can also create a one-time Cloud Run job to run migrations:

```bash
gcloud run jobs create run-migrations \
    --image gcr.io/$PROJECT_ID/pos-repair-api:latest \
    --region $REGION \
    --add-cloudsql-instances $CONNECTION_NAME \
    --set-env-vars "DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@/pos_repair_platform?host=/cloudsql/$CONNECTION_NAME" \
    --command "npx,prisma,migrate,deploy"

# Execute the job
gcloud run jobs execute run-migrations --region $REGION
```

---

## Step 13: Verify Deployment

### 13.1 Check API Health

```bash
# Test API endpoint
curl $API_URL/

# Or open in browser
echo "Open in browser: $API_URL"
```

### 13.2 Check Web Health

```bash
# Test Web endpoint
curl $WEB_URL/

# Or open in browser
echo "Open in browser: $WEB_URL"
```

### 13.3 Check Logs

```bash
# View API logs
gcloud run services logs read pos-repair-api --region $REGION

# View Web logs
gcloud run services logs read pos-repair-web --region $REGION
```

---

## Step 14: Set Up Custom Domain (Optional)

### 14.1 Map Custom Domain to API

```bash
gcloud run domain-mappings create \
    --service pos-repair-api \
    --domain api.yourdomain.com \
    --region $REGION
```

### 14.2 Map Custom Domain to Web

```bash
gcloud run domain-mappings create \
    --service pos-repair-web \
    --domain yourdomain.com \
    --region $REGION
```

### 14.3 Update DNS Records

Follow the instructions provided by the domain mapping command to update your DNS records.

---

## Step 15: Set Up Monitoring (Optional but Recommended)

### 15.1 Enable Monitoring

```bash
# Enable Cloud Monitoring API
gcloud services enable monitoring.googleapis.com
```

### 15.2 Create Alert Policies

Go to: https://console.cloud.google.com/monitoring/alerting

Create alerts for:
- High error rates
- High latency
- Low availability
- Memory/CPU usage

---

## Quick Reference: All Your Values

Save this information in a secure location:

```bash
echo "=== GCP Configuration ==="
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Zone: $ZONE"
echo ""
echo "=== Redis (Memorystore) ==="
echo "Instance ID: $INSTANCE_ID"
echo "IP: $REDIS_IP"
echo "Port: $REDIS_PORT"
echo ""
echo "=== Cloud SQL ==="
echo "Instance: $SQL_INSTANCE"
echo "Connection: $CONNECTION_NAME"
echo "Database: pos_repair_platform"
echo "User: $DB_USER"
echo ""
echo "=== URLs ==="
echo "API: $API_URL"
echo "Web: $WEB_URL"
```

---

## Troubleshooting

### Issue: "Permission denied" errors

**Solution:** Ensure billing is enabled and APIs are enabled:
```bash
gcloud services enable redis.googleapis.com sqladmin.googleapis.com
```

### Issue: Can't connect to Memorystore

**Solution:** Ensure VPC connector is created and attached to Cloud Run service.

### Issue: Database connection fails

**Solution:** 
1. Check connection name is correct
2. Verify Cloud SQL instance is running
3. Check firewall rules allow connections

### Issue: Images won't push

**Solution:** 
```bash
gcloud auth configure-docker
gcloud auth login
```

---

## Next Steps

1. ✅ Set up custom domains
2. ✅ Configure SSL certificates
3. ✅ Set up CI/CD pipeline
4. ✅ Configure monitoring and alerts
5. ✅ Set up backup strategies
6. ✅ Review and optimize costs

---

## Cost Estimation

Approximate monthly costs (varies by region and usage):

- **Memorystore (1GB)**: ~$30/month
- **Cloud SQL (db-f1-micro)**: ~$7/month
- **Cloud Run (API)**: ~$10-50/month (depends on traffic)
- **Cloud Run (Web)**: ~$5-30/month (depends on traffic)
- **VPC Connector**: ~$10/month
- **Total**: ~$60-120/month (for low-medium traffic)

**Note:** These are estimates. Actual costs depend on usage, region, and traffic patterns.

---

## Support

If you encounter issues:

1. Check the logs: `gcloud run services logs read SERVICE_NAME --region $REGION`
2. Review GCP documentation: https://cloud.google.com/docs
3. Check service status: https://status.cloud.google.com/

---

**Congratulations!** Your POS Repair Platform is now deployed on GCP! 🎉

