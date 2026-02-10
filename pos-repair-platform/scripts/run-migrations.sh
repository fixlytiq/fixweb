#!/usr/bin/env bash
# Run Prisma migrations. Loads DB credentials from apps/api/.env (DATABASE_URL or POSTGRES_*).
# With Cloud SQL Proxy: start proxy, then run this script from pos-repair-platform.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
API_DIR="$ROOT_DIR/apps/api"
ENV_FILE="$API_DIR/.env"

# Load .env from apps/api if present
if [ -f "$ENV_FILE" ]; then
  set -a
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      '#'*) ;;
      [A-Za-z_]*=*) export "$line" ;;
    esac
  done < "$ENV_FILE"
  set +a
fi

# If still no DATABASE_URL, build from POSTGRES_* vars
if [ -z "$DATABASE_URL" ] && [ -n "$POSTGRES_USER" ]; then
  POSTGRES_HOST="${POSTGRES_HOST:-127.0.0.1}"
  POSTGRES_PORT="${POSTGRES_PORT:-5432}"
  POSTGRES_DB="${POSTGRES_DB:-pos_repair_platform}"
  PASS_ENC=$(node -e "console.log(encodeURIComponent(process.argv[1] || ''))" "${POSTGRES_PASSWORD:-}")
  export DATABASE_URL="postgresql://${POSTGRES_USER}:${PASS_ENC}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"
fi

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL is not set. Add DATABASE_URL or POSTGRES_USER/POSTGRES_PASSWORD/POSTGRES_DB to apps/api/.env"
  exit 1
fi

cd "$API_DIR"
echo "Running Prisma migrations from $API_DIR ..."
npx prisma migrate deploy --schema=prisma/schema.prisma
echo "Migrations completed."
