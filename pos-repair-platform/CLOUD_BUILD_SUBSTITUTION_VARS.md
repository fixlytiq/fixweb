# Cloud Build Substitution Variables Template

Use this template when creating your Cloud Build trigger. Copy values from your `.gcp-config` file.

## Required Substitution Variables

When creating your Cloud Build trigger, add these substitution variables:

### 1. `_SQL_CONNECTION_NAME`
```
Value: [CONNECTION_NAME from .gcp-config]
Example: my-project:us-central1:pos-repair-postgres
```

### 2. `_VPC_CONNECTOR`
```
Value: pos-repair-connector
(or your connector name from .gcp-config)
```

### 3. `_DATABASE_URL`
```
Format: postgresql://[SQL_USER]:[SQL_PASSWORD]@/[SQL_DATABASE]?host=/cloudsql/[CONNECTION_NAME]

Example:
postgresql://posrepair_user:YOUR_PASSWORD@/pos_repair_platform?host=/cloudsql/my-project:us-central1:pos-repair-postgres

Replace:
- [SQL_USER] with SQL_USER from .gcp-config
- [SQL_PASSWORD] with SQL_PASSWORD from .gcp-config
- [SQL_DATABASE] with SQL_DATABASE from .gcp-config
- [CONNECTION_NAME] with CONNECTION_NAME from .gcp-config
```

### 4. `_REDIS_HOST`
```
Value: [REDIS_IP from .gcp-config]
Example: 10.0.0.3
```

### 5. `_JWT_SECRET`
```
Value: [JWT_SECRET from .gcp-config]
Example: abc123xyz789... (32+ character string)
```

### 6. `_FRONTEND_URL`
```
Use semicolons (;) to separate URLs—commas break gcloud --set-env-vars.

Format: https://pos-repair-web-[PROJECT_NUMBER].us-central1.run.app;https://pos-repair-owner-[PROJECT_NUMBER].us-central1.run.app

Example:
https://pos-repair-web-123456789.us-central1.run.app;https://pos-repair-owner-123456789.us-central1.run.app

Replace [PROJECT_NUMBER] with PROJECT_NUMBER from .gcp-config
```

## Quick Copy Template

After running the setup script, fill in these values from your `.gcp-config`:

```
_SQL_CONNECTION_NAME = [CONNECTION_NAME]
_VPC_CONNECTOR = pos-repair-connector
_DATABASE_URL = postgresql://[SQL_USER]:[SQL_PASSWORD]@/[SQL_DATABASE]?host=/cloudsql/[CONNECTION_NAME]
_REDIS_HOST = [REDIS_IP]
_JWT_SECRET = [JWT_SECRET]
_FRONTEND_URL = https://pos-repair-web-[PROJECT_NUMBER].us-central1.run.app;https://pos-repair-owner-[PROJECT_NUMBER].us-central1.run.app
```

## Verification

After setting up the trigger, verify:
1. All variable names start with underscore `_`
2. `_DATABASE_URL` uses Unix socket format (`/cloudsql/...`)
3. `_FRONTEND_URL` includes both web and owner URLs (semicolon-separated; commas break gcloud)
4. `_REDIS_HOST` is the IP address (not hostname)
5. All values match exactly what's in `.gcp-config`

## Troubleshooting

**Build fails with "variable not found"**
- Check variable names start with `_`
- Verify all variables are added in the trigger settings

**API can't connect to database**
- Verify `_DATABASE_URL` format is correct
- Check `_SQL_CONNECTION_NAME` matches Cloud SQL instance

**API can't connect to Redis**
- Verify `_REDIS_HOST` is the correct IP address
- Check VPC connector name matches
