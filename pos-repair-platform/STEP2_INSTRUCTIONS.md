# Step 2: Create a GCP Project - Instructions

## Quick Commands

### 1. Login to Google Cloud

```bash
gcloud auth login
```

This will open a browser window. Sign in with your Google account that has GCP access.

### 2. Create Project (Choose One Method)

#### Method A: Using gcloud CLI (Recommended)

```bash
# Generate a unique project ID
export PROJECT_ID="pos-repair-platform-$(date +%s)"

# Create the project
gcloud projects create $PROJECT_ID --name="POS Repair Platform"

# Set it as active
gcloud config set project $PROJECT_ID

# Verify
gcloud config get-value project
```

#### Method B: Using GCP Console

1. Go to: https://console.cloud.google.com/
2. Click the project dropdown (top left)
3. Click "New Project"
4. Enter project name: "POS Repair Platform"
5. Click "Create"
6. Wait for creation (30-60 seconds)
7. Select the project from dropdown

Then set it in terminal:
```bash
export PROJECT_ID="your-project-id-from-console"
gcloud config set project $PROJECT_ID
```

### 3. Enable Billing

**Important:** Billing must be enabled to create resources!

1. Go to: https://console.cloud.google.com/billing
2. If you don't have a billing account:
   - Click "Create Account"
   - Enter payment information
   - Complete setup
3. Link billing to your project:
   - Go to: https://console.cloud.google.com/billing/linked
   - Click "Link a billing account"
   - Select your project and billing account
   - Click "Set account"

Or using CLI (if you know your billing account ID):
```bash
gcloud billing projects link $PROJECT_ID --billing-account=YOUR_BILLING_ACCOUNT_ID
```

### 4. Verify Setup

```bash
# Check current project
gcloud config get-value project

# List your projects
gcloud projects list

# Check billing status
gcloud billing projects describe $PROJECT_ID
```

## Troubleshooting

### "Permission denied" errors
- Make sure you're logged in: `gcloud auth list`
- Verify project is selected: `gcloud config get-value project`

### "Billing not enabled" errors
- Enable billing in GCP Console
- Wait a few minutes after enabling

### Project creation fails
- Project IDs must be globally unique
- Try a different project ID
- Check if you have project creation permissions

## Next Step

Once your project is created and billing is enabled, proceed to:

**Step 3: Enable Required APIs**

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

