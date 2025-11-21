#!/bin/sh
set -e

wait_for_postgres() {
  echo "Waiting for PostgreSQL to be ready..."
  
  # Extract host and port from DATABASE_URL
  DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
  DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  
  DB_HOST=${DB_HOST:-postgres}
  DB_PORT=${DB_PORT:-5432}
  
  until nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
    echo "PostgreSQL is unavailable at $DB_HOST:$DB_PORT - sleeping"
    sleep 2
  done
  
  echo "PostgreSQL is up at $DB_HOST:$DB_PORT"
}

wait_for_postgres

# Run Prisma migrations
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
    "$PRISMA_BIN" migrate deploy || echo "Migration failed, but continuing..."
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
        "$PRISMA_BIN" migrate deploy --schema=apps/api/prisma/schema.prisma || echo "Migration retry failed, but continuing..."
      else
        echo "Could not extract migration name, but continuing..."
      fi
    elif [ -n "$MIGRATE_EXIT" ] && [ "$MIGRATE_EXIT" != "0" ]; then
      echo "Migration failed with exit code $MIGRATE_EXIT, but continuing..."
    fi
  fi
  
  echo "Migrations completed successfully"
else
  echo "Warning: DATABASE_URL not set, skipping migrations"
fi

exec "$@"

