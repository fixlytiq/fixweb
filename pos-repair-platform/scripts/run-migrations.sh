#!/usr/bin/env bash
# Run Prisma migrations against the database in DATABASE_URL.
# Use when the Cloud Run migration job can't reach Cloud SQL (e.g. socket not ready).
#
# Option 1 - Cloud SQL Proxy (recommended):
#   1. Start proxy: cloud_sql_proxy -instances=repair-pos-485101:us-central1:pos-repair-postgres=tcp:5432
#   2. export DATABASE_URL="postgresql://USER:PASSWORD@127.0.0.1:5432/DATABASE"
#   3. ./scripts/run-migrations.sh
#
# Option 2 - Public IP (if enabled on the instance):
#   export DATABASE_URL="postgresql://USER:PASSWORD@PUBLIC_IP:5432/DATABASE"
#   ./scripts/run-migrations.sh
#
# Requires: Node, npm, and being in repo root or pos-repair-platform.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
API_DIR="$ROOT_DIR/apps/api"

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL is not set. Set it to a reachable Postgres URL (e.g. via Cloud SQL Proxy)."
  exit 1
fi

cd "$API_DIR"
echo "Running Prisma migrations from $API_DIR ..."
npx prisma migrate deploy --schema=prisma/schema.prisma
echo "Migrations completed."
