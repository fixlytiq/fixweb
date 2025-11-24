#!/bin/sh
set -e

echo "Fixing database migrations..."

# Create enum types if they don't exist
psql "$DATABASE_URL" << 'SQL'
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StoreRole') THEN
        CREATE TYPE "StoreRole" AS ENUM ('OWNER', 'MANAGER', 'TECHNICIAN', 'CASHIER', 'VIEWER');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketStatus') THEN
        CREATE TYPE "TicketStatus" AS ENUM ('RECEIVED', 'IN_PROGRESS', 'AWAITING_PARTS', 'READY', 'COMPLETED', 'CANCELLED');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketNoteVisibility') THEN
        CREATE TYPE "TicketNoteVisibility" AS ENUM ('INTERNAL', 'CUSTOMER');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StockMovementReason') THEN
        CREATE TYPE "StockMovementReason" AS ENUM ('SALE', 'PURCHASE', 'ADJUSTMENT', 'RETURN', 'TRANSFER', 'RESERVATION', 'RELEASE');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus') THEN
        CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'PAID', 'REFUNDED', 'VOID');
    END IF;
END $$;
SQL

echo "Enum types created/verified"

# Resolve failed migration
cd /app
node apps/api/node_modules/.bin/prisma migrate resolve --rolled-back 20250115000000_remove_organization_add_owner_employee --schema apps/api/prisma/schema.prisma || echo "Migration already resolved or doesn't exist"

# Run migrations
echo "Running migrations..."
node apps/api/node_modules/.bin/prisma migrate deploy --schema apps/api/prisma/schema.prisma

echo "Migrations completed successfully!"

