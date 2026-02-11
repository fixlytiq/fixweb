-- Ensure Store.taxRate exists (idempotent; fixes DBs where 20250117 didn't apply)
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "taxRate" DECIMAL(5,4) DEFAULT 0.08;
