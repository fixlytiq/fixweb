# Run Prisma migrations against the database in DATABASE_URL.
# Use when the Cloud Run migration job can't reach Cloud SQL (e.g. socket not ready).
#
# Option 1 - Cloud SQL Proxy (recommended):
#   1. Start proxy: cloud_sql_proxy -instances=repair-pos-485101:us-central1:pos-repair-postgres=tcp:5432
#   2. $env:DATABASE_URL = "postgresql://USER:PASSWORD@127.0.0.1:5432/DATABASE"
#   3. .\scripts\run-migrations.ps1
#
# Option 2 - Public IP (if enabled on the instance):
#   $env:DATABASE_URL = "postgresql://USER:PASSWORD@PUBLIC_IP:5432/DATABASE"
#   .\scripts\run-migrations.ps1

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$ApiDir = Join-Path $RootDir "apps\api"

if (-not $env:DATABASE_URL) {
  Write-Error "DATABASE_URL is not set. Set it to a reachable Postgres URL (e.g. via Cloud SQL Proxy)."
  exit 1
}

Push-Location $ApiDir
try {
  Write-Host "Running Prisma migrations from $ApiDir ..."
  npx prisma migrate deploy --schema=prisma/schema.prisma
  Write-Host "Migrations completed."
} finally {
  Pop-Location
}
