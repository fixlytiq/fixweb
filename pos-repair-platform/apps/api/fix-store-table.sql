-- Add columns if they don't exist
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "ownerId" TEXT;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "storeEmail" TEXT;

-- For existing stores without ownerId, create temporary owners
DO $$ 
BEGIN
    INSERT INTO "Owner" ("id", "email", "password")
    SELECT 
        gen_random_uuid()::text as id,
        'temp_owner_' || s.id || '@temp.com' as email,
        '' as password
    FROM "Store" s
    WHERE s."ownerId" IS NULL
    AND NOT EXISTS (
        SELECT 1 FROM "Owner" o WHERE o.email = 'temp_owner_' || s.id || '@temp.com'
    );
END $$;

-- Update stores to have ownerId and storeEmail
UPDATE "Store" s
SET 
    "ownerId" = COALESCE(s."ownerId", (SELECT o.id FROM "Owner" o WHERE o.email = 'temp_owner_' || s.id || '@temp.com' LIMIT 1)),
    "storeEmail" = COALESCE(s."storeEmail", 'store_' || s.id || '@temp.com')
WHERE s."ownerId" IS NULL OR s."storeEmail" IS NULL;

-- Make columns required
ALTER TABLE "Store" ALTER COLUMN "ownerId" SET NOT NULL;
ALTER TABLE "Store" ALTER COLUMN "storeEmail" SET NOT NULL;

-- Add unique constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Store_storeEmail_key'
    ) THEN
        ALTER TABLE "Store" ADD CONSTRAINT "Store_storeEmail_key" UNIQUE ("storeEmail");
    END IF;
END $$;
