#!/bin/sh
set -e

# Wait for Cloud SQL Proxy to mount the Unix socket (Cloud Run)
wait_for_cloudsql_socket() {
  if ! echo "$DATABASE_URL" | grep -q "/cloudsql/"; then
    return 0
  fi
  # Extract socket path: host=/cloudsql/PROJECT:REGION:INSTANCE -> /cloudsql/PROJECT:REGION:INSTANCE
  SOCKET_PATH=$(echo "$DATABASE_URL" | sed -n 's|.*/cloudsql/\([^?]*\).*|/cloudsql/\1|p')
  if [ -z "$SOCKET_PATH" ]; then
    return 0
  fi
  echo "Waiting for Cloud SQL socket at $SOCKET_PATH..."
  RETRIES=15
  while [ $RETRIES -gt 0 ]; do
    if [ -e "$SOCKET_PATH" ] || [ -S "$SOCKET_PATH" ]; then
      echo "Cloud SQL socket is ready."
      return 0
    fi
    echo "Socket not ready, waiting... ($RETRIES retries left)"
    RETRIES=$((RETRIES-1))
    sleep 2
  done
  echo "Warning: Cloud SQL socket did not appear in time, continuing anyway..."
}

wait_for_postgres() {
  echo "Checking PostgreSQL connection..."
  
  # Check if using Cloud SQL Unix socket (Cloud Run)
  if echo "$DATABASE_URL" | grep -q "/cloudsql/"; then
    wait_for_cloudsql_socket
    echo "Detected Cloud SQL Unix socket connection - skipping host/port check"
    return 0
  fi
  
  # Extract connection details from DATABASE_URL
  # Format: postgresql://user:password@host:port/database
  DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
  DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  DB_USER=$(echo "$DATABASE_URL" | sed -n 's|postgresql://\([^:]*\):.*|\1|p')
  DB_PASS=$(echo "$DATABASE_URL" | sed -n 's|postgresql://[^:]*:\([^@]*\)@.*|\1|p')
  DB_NAME=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')
  # URL-decode password so psql gets the real password (e.g. %40 -> @, %2A -> *)
  DB_PASS=$(echo "$DB_PASS" | sed 's/%40/@/g; s/%2A/*/g; s/%23/#/g; s/%2F/\//g')

  DB_HOST=${DB_HOST:-postgres}
  DB_PORT=${DB_PORT:-5432}
  DB_USER=${DB_USER:-postgres}
  DB_NAME=${DB_NAME:-pos_repair_platform}
  
  echo "Waiting for PostgreSQL at $DB_HOST:$DB_PORT..."
  RETRIES=30
  until nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
    if [ $RETRIES -eq 0 ]; then
      echo "PostgreSQL is unavailable at $DB_HOST:$DB_PORT - giving up"
      exit 1
    fi
    echo "PostgreSQL is unavailable at $DB_HOST:$DB_PORT - sleeping ($RETRIES retries left)"
    RETRIES=$((RETRIES-1))
    sleep 2
  done
  
  echo "PostgreSQL is up at $DB_HOST:$DB_PORT"
  
  # When using private IP (e.g. 10.x), skip psql check - Prisma will auth in migrate deploy.
  # psql often fails with URL-encoded passwords; nc already confirmed the port is open.
  case "$DB_HOST" in
    [0-9]*.[0-9]*.[0-9]*.[0-9]*) echo "Private IP detected - skipping psql readiness check"; ;;
    *)
      echo "Waiting for database '$DB_NAME' to be ready..."
      RETRIES=30
      until [ $RETRIES -eq 0 ]; do
        if [ -n "$DB_PASS" ]; then
          PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1 && break
        else
          psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1 && break
        fi
        echo "Database not ready, waiting... ($RETRIES retries left)"
        RETRIES=$((RETRIES-1))
        sleep 2
      done
      if [ $RETRIES -eq 0 ]; then
        echo "Database connection failed after all retries"
        exit 1
      fi
      ;;
  esac
  echo "Database is ready!"
}

# Only wait for DB when running the migration job. For the API service, start immediately
# so Cloud Run sees the container listen on PORT in time; Prisma connects on first use.
if [ "$RUN_MIGRATIONS_ONLY" = "1" ]; then
  wait_for_postgres
fi

# When RUN_MIGRATIONS_ONLY=1 (e.g. Cloud Run Job), run migrations and exit. Service container skips migrations.
if [ "$RUN_MIGRATIONS_ONLY" = "1" ]; then
  if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: RUN_MIGRATIONS_ONLY=1 but DATABASE_URL not set. Set _DATABASE_URL in the Cloud Build trigger."
    exit 1
  fi
  if echo "$DATABASE_URL" | grep -q '/cloudsql/'; then
    echo "ERROR: Use private IP for DATABASE_URL (e.g. postgresql://user:pass@10.221.0.3:5432/pos_repair_platform). Set _DATABASE_URL in the Cloud Build trigger. Cloud SQL socket is not used."
    exit 1
  fi
  echo "Running Prisma migrations (job)..."
  cd /app
  PRISMA_BIN="/app/apps/api/node_modules/.bin/prisma"
  [ ! -f "$PRISMA_BIN" ] && PRISMA_BIN="/app/node_modules/.bin/prisma"
  echo "Using Prisma at $PRISMA_BIN (exists: $(test -f "$PRISMA_BIN" && echo yes || echo no)), cwd=$(pwd)"
  if [ ! -f "$PRISMA_BIN" ]; then
    echo "Error: Prisma binary not found in /app/apps/api/node_modules/.bin or /app/node_modules/.bin"
    exit 1
  fi
  # Clear any previously failed migration so deploy can re-run in correct order
  echo "Resolving any failed migration (idempotent)..."
  "$PRISMA_BIN" migrate resolve --rolled-back "20250115000000_remove_organization_add_owner_employee" --schema=apps/api/prisma/schema.prisma 2>/dev/null || true
  echo "Executing: prisma migrate deploy --schema=apps/api/prisma/schema.prisma"
  # BusyBox timeout uses "timeout SECS PROG ARGS" (no -t); GNU timeout accepts same
  if command -v timeout >/dev/null 2>&1; then
    timeout 180 "$PRISMA_BIN" migrate deploy --schema=apps/api/prisma/schema.prisma 2>&1
  else
    "$PRISMA_BIN" migrate deploy --schema=apps/api/prisma/schema.prisma 2>&1
  fi
  MIGRATE_EXIT=$?
  echo "Prisma exit code: $MIGRATE_EXIT"
  if [ "$MIGRATE_EXIT" = "124" ] || [ "$MIGRATE_EXIT" = "137" ]; then
    echo "ERROR: Migration timed out"
    exit 1
  fi
  if [ -n "$MIGRATE_EXIT" ] && [ "$MIGRATE_EXIT" != "0" ]; then
    echo "Migration failed with exit $MIGRATE_EXIT"
    exit 1
  fi
  echo "Migrations completed successfully."
  exit 0
fi

# Service path: skip migrations (run in job). Start app so Cloud Run sees listen quickly.
echo "Starting application..."
exec "$@"
