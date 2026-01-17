-- Resolve Failed Migration
-- Run this in GCP Console SQL Editor for the pos_repair_platform database

-- Delete the failed migration record
DELETE FROM "_prisma_migrations" 
WHERE "migration_name" = '20250115000000_remove_organization_add_owner_employee' 
AND "finished_at" IS NULL;

-- Verify it's deleted
SELECT * FROM "_prisma_migrations" 
WHERE "migration_name" = '20250115000000_remove_organization_add_owner_employee';
