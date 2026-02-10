# Run Prisma migrations. Loads DB credentials from apps/api/.env (DATABASE_URL or POSTGRES_*).
# With Cloud SQL Proxy: start proxy, then run this script from pos-repair-platform.
#   cloud_sql_proxy -instances=repair-pos-485101:us-central1:pos-repair-postgres=tcp:5432

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$ApiDir = Join-Path $RootDir "apps\api"
$EnvFile = Join-Path $ApiDir ".env"

# Load .env from apps/api if present
if (Test-Path $EnvFile) {
  Get-Content $EnvFile | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
      $key = $Matches[1].Trim()
      $val = $Matches[2].Trim().Trim('"').Trim("'")
      Set-Item -Path "Env:$key" -Value $val
    }
  }
}

# If still no DATABASE_URL, build from POSTGRES_* vars
if (-not $env:DATABASE_URL -and $env:POSTGRES_USER) {
  $dbHost = if ($env:POSTGRES_HOST) { $env:POSTGRES_HOST } else { "127.0.0.1" }
  $dbPort = if ($env:POSTGRES_PORT) { $env:POSTGRES_PORT } else { "5432" }
  $user = $env:POSTGRES_USER
  $pass = if ($env:POSTGRES_PASSWORD) { $env:POSTGRES_PASSWORD } else { "" }
  $db   = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "pos_repair_platform" }
  $passEnc = [Uri]::EscapeDataString($pass)
  $env:DATABASE_URL = "postgresql://${user}:${passEnc}@${dbHost}:${dbPort}/${db}"
}

if (-not $env:DATABASE_URL) {
  Write-Error "DATABASE_URL is not set. Add DATABASE_URL or POSTGRES_USER/POSTGRES_PASSWORD/POSTGRES_DB to apps/api/.env"
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
