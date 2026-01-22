# Fix Build Trigger Path

## Issue
The build trigger is looking for `cloudbuild.yaml` in the repository root, but it's actually located at `pos-repair-platform/cloudbuild.yaml`.

## Solution

You need to update the trigger in the Cloud Build console:

1. **Go to Cloud Build Triggers:**
   https://console.cloud.google.com/cloud-build/triggers?project=repair-pos-485101

2. **Click on your trigger** (`deploy-main`)

3. **Click "Edit"**

4. **In the Configuration section**, update:
   - **Cloud Build configuration file**: Change from `cloudbuild.yaml` to `pos-repair-platform/cloudbuild.yaml`

5. **Click "Save"**

## Alternative: Move cloudbuild.yaml to Root

If you prefer, you can copy cloudbuild.yaml to the repository root, but you'll also need to update all the paths in it (apps/api/Dockerfile → pos-repair-platform/apps/api/Dockerfile, etc.)

**Recommended:** Update the trigger path to `pos-repair-platform/cloudbuild.yaml`
