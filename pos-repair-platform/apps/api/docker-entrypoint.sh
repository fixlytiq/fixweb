#!/bin/sh
set -e

wait_for_postgres() {
  echo "Checking PostgreSQL connection..."
  
  # Check if using Cloud SQL Unix socket (Cloud Run)
  if echo "$DATABASE_URL" | grep -q "/cloudsql/"; then
    echo "Detected Cloud SQL Unix socket connection - skipping host/port check"
    # For Cloud SQL, we'll let Prisma handle the connection
    return 0
  fi
  
  # Extract connection details from DATABASE_URL
  # Format: postgresql://user:password@host:port/database
  DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
  DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  DB_USER=$(echo "$DATABASE_URL" | sed -n 's|postgresql://\([^:]*\):.*|\1|p')
  DB_PASS=$(echo "$DATABASE_URL" | sed -n 's|postgresql://[^:]*:\([^@]*\)@.*|\1|p')
  DB_NAME=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')
  
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
  
  # Wait for database to be ready to accept connections
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
  
  echo "Database is ready!"
}

wait_for_postgres

# Run Prisma migrations synchronously (must complete before app starts)
if [ -n "$DATABASE_URL" ]; then
  echo "Running Prisma migrations..."
  cd /app
  
  # Find Prisma binary
  PRISMA_BIN="/app/apps/api/node_modules/.bin/prisma"
  if [ ! -f "$PRISMA_BIN" ]; then
    PRISMA_BIN="/app/node_modules/.bin/prisma"
  fi
  
  if [ ! -f "$PRISMA_BIN" ]; then
    echo "Error: Prisma binary not found"
    exit 1
  fi
  
  # Check Prisma version
  PRISMA_VERSION=$("$PRISMA_BIN" --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -n1 || echo "")
  PRISMA_MAJOR=$(echo "$PRISMA_VERSION" | cut -d. -f1)
  
  if [ "$PRISMA_MAJOR" = "7" ]; then
    # Prisma 7 - temporarily remove url from schema and create config
    echo "Detected Prisma 7, temporarily modifying schema..."
    sed -i.bak '/url.*env("DATABASE_URL")/d' apps/api/prisma/schema.prisma
    
    # Create prisma.config.ts
    cat > apps/api/prisma.config.ts << 'EOF'
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'apps/api/prisma/schema.prisma',
  migrations: {
    path: 'apps/api/prisma/migrations'
  },
  engine: 'classic',
  datasource: {
    url: env('DATABASE_URL')
  }
});
EOF
    
    # Run migrations with Prisma 7
    cd apps/api
    "$PRISMA_BIN" migrate deploy || {
      echo "Migration failed!"
      cd /app
      # Restore original schema
      if [ -f "apps/api/prisma/schema.prisma.bak" ]; then
        mv apps/api/prisma/schema.prisma.bak apps/api/prisma/schema.prisma
      fi
      exit 1
    }
    cd /app
    
    # Restore original schema
    if [ -f "apps/api/prisma/schema.prisma.bak" ]; then
      mv apps/api/prisma/schema.prisma.bak apps/api/prisma/schema.prisma
    fi
  else
    # Prisma 6 - use schema with url
    echo "Detected Prisma 6, using schema with url..."
    cd /app
    MIGRATE_OUTPUT=$("$PRISMA_BIN" migrate deploy --schema=apps/api/prisma/schema.prisma 2>&1) || MIGRATE_EXIT=$?
    echo "$MIGRATE_OUTPUT"
    
    # Check if it's a failed migration issue (P3009)
    if echo "$MIGRATE_OUTPUT" | grep -q "P3009\|failed migrations"; then
      echo "Resolving failed migrations..."
      # Extract migration name from error
      FAILED_MIGRATION=$(echo "$MIGRATE_OUTPUT" | grep -oE '[0-9]+_[a-z_]+' | head -n1 || echo "")
      if [ -n "$FAILED_MIGRATION" ]; then
        echo "Marking migration $FAILED_MIGRATION as rolled back..."
        "$PRISMA_BIN" migrate resolve --rolled-back "$FAILED_MIGRATION" --schema=apps/api/prisma/schema.prisma || true
        # Retry migration
        echo "Retrying migrations..."
        "$PRISMA_BIN" migrate deploy --schema=apps/api/prisma/schema.prisma || {
          echo "Migration retry failed!"
          exit 1
        }
      else
        echo "Could not extract migration name!"
        exit 1
      fi
    elif [ -n "$MIGRATE_EXIT" ] && [ "$MIGRATE_EXIT" != "0" ]; then
      echo "WARNING: Migration failed with exit code $MIGRATE_EXIT!"
      echo "The application will start, but database migrations may need to be run manually."
      echo "You can run migrations manually with: npx prisma migrate deploy"
    fi
  fi
  
  echo "Migrations completed successfully"
else
  echo "Warning: DATABASE_URL not set, skipping migrations"
fi

echo "Starting application..."
exec "$@"

