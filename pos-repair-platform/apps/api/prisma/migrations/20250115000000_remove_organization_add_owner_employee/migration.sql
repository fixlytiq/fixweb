-- CreateTable
CREATE TABLE IF NOT EXISTS "Owner" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Employee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "role" "StoreRole" NOT NULL,
    "storeId" TEXT NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- Step 1: Create temporary owners for existing stores
-- For each store, create an owner using the first user's email from memberships
INSERT INTO "Owner" ("id", "email", "password")
SELECT 
    gen_random_uuid()::text as id,
    COALESCE(u.email, 'temp_' || s.id || '@temp.com') as email,
    '$2a$10$temp' as password
FROM "Store" s
LEFT JOIN "Membership" m ON m."organizationId" = s."organizationId"
LEFT JOIN "User" u ON u.id = m."userId"
WHERE NOT EXISTS (
    SELECT 1 FROM "Owner" o WHERE o.email = COALESCE(u.email, 'temp_' || s.id || '@temp.com')
)
GROUP BY s.id, COALESCE(u.email, 'temp_' || s.id || '@temp.com');

-- Step 2: Add new columns to Store (nullable first)
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "ownerId" TEXT;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "storeEmail" TEXT;

-- Step 3: Populate ownerId and storeEmail for existing stores
UPDATE "Store" s
SET 
    "ownerId" = (
        SELECT o.id 
        FROM "Owner" o 
        WHERE o.email = COALESCE(
            (SELECT u.email FROM "Membership" m JOIN "User" u ON u.id = m."userId" WHERE m."organizationId" = s."organizationId" LIMIT 1),
            'temp_' || s.id || '@temp.com'
        )
        LIMIT 1
    ),
    "storeEmail" = COALESCE(
        (SELECT u.email FROM "Membership" m JOIN "User" u ON u.id = m."userId" WHERE m."organizationId" = s."organizationId" LIMIT 1),
        'store_' || s.id || '@temp.com'
    )
WHERE "ownerId" IS NULL;

-- Step 4: Make columns required
ALTER TABLE "Store" ALTER COLUMN "ownerId" SET NOT NULL;
ALTER TABLE "Store" ALTER COLUMN "storeEmail" SET NOT NULL;

-- Step 5: Create employees from existing users/memberships
-- This creates employees for users who have store roles
INSERT INTO "Employee" ("id", "name", "pin", "role", "storeId")
SELECT 
    gen_random_uuid()::text as id,
    COALESCE(u."firstName" || ' ' || u."lastName", u.email, 'Employee') as name,
    u."passwordHash" as pin, -- Use existing password hash as PIN (will need to be reset)
    COALESCE(
        CASE 
            WHEN sur."role" = 'OWNER' THEN 'OWNER'::"StoreRole"
            WHEN sur."role" = 'MANAGER' THEN 'MANAGER'::"StoreRole"
            WHEN sur."role" = 'TECHNICIAN' THEN 'TECHNICIAN'::"StoreRole"
            WHEN sur."role" = 'CASHIER' THEN 'CASHIER'::"StoreRole"
            ELSE 'VIEWER'::"StoreRole"
        END,
        'VIEWER'::"StoreRole"
    ) as role,
    sur."storeId"
FROM "StoreUserRole" sur
JOIN "Membership" m ON m.id = sur."membershipId"
JOIN "User" u ON u.id = m."userId"
WHERE NOT EXISTS (
    SELECT 1 FROM "Employee" e 
    WHERE e."storeId" = sur."storeId" 
    AND e.pin = u."passwordHash"
);

-- Step 6: If no employees exist, create one for each store from the owner
INSERT INTO "Employee" ("id", "name", "pin", "role", "storeId")
SELECT 
    gen_random_uuid()::text as id,
    'Store Owner' as name,
    o.password as pin,
    'OWNER'::"StoreRole" as role,
    s.id as "storeId"
FROM "Store" s
JOIN "Owner" o ON o.id = s."ownerId"
WHERE NOT EXISTS (
    SELECT 1 FROM "Employee" e WHERE e."storeId" = s.id
);

-- Step 7: Update all foreign key references to remove organizationId
-- Update Ticket
ALTER TABLE "Ticket" DROP CONSTRAINT IF EXISTS "Ticket_organizationId_fkey";
ALTER TABLE "Ticket" DROP COLUMN IF EXISTS "organizationId";

-- Update StockItem
ALTER TABLE "StockItem" DROP CONSTRAINT IF EXISTS "StockItem_organizationId_fkey";
ALTER TABLE "StockItem" DROP COLUMN IF EXISTS "organizationId";

-- Update StockMovement
ALTER TABLE "StockMovement" DROP CONSTRAINT IF EXISTS "StockMovement_organizationId_fkey";
ALTER TABLE "StockMovement" DROP COLUMN IF EXISTS "organizationId";

-- Update Vendor
ALTER TABLE "Vendor" DROP CONSTRAINT IF EXISTS "Vendor_organizationId_fkey";
ALTER TABLE "Vendor" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "storeId" TEXT;
UPDATE "Vendor" v SET "storeId" = (SELECT s.id FROM "Store" s WHERE s."organizationId" = v."organizationId" LIMIT 1) WHERE "storeId" IS NULL;
ALTER TABLE "Vendor" ALTER COLUMN "storeId" SET NOT NULL;

-- Update PurchaseOrder
ALTER TABLE "PurchaseOrder" DROP CONSTRAINT IF EXISTS "PurchaseOrder_organizationId_fkey";
ALTER TABLE "PurchaseOrder" DROP COLUMN IF EXISTS "organizationId";

-- Update Sale
ALTER TABLE "Sale" DROP CONSTRAINT IF EXISTS "Sale_organizationId_fkey";
ALTER TABLE "Sale" DROP COLUMN IF EXISTS "organizationId";

-- Update Dispute
ALTER TABLE "Dispute" DROP CONSTRAINT IF EXISTS "Dispute_organizationId_fkey";
ALTER TABLE "Dispute" DROP COLUMN IF EXISTS "organizationId";

-- Update TimeClock
ALTER TABLE "TimeClock" DROP CONSTRAINT IF EXISTS "TimeClock_organizationId_fkey";
ALTER TABLE "TimeClock" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "TimeClock" ADD COLUMN IF NOT EXISTS "employeeId" TEXT;
-- Map existing userId to employeeId (if possible)
UPDATE "TimeClock" tc
SET "employeeId" = (
    SELECT e.id 
    FROM "Employee" e 
    JOIN "User" u ON u."passwordHash" = e.pin
    WHERE u.id = tc."userId" 
    AND e."storeId" = tc."storeId"
    LIMIT 1
)
WHERE "employeeId" IS NULL;
-- For time clocks without matching employees, create temporary employees
INSERT INTO "Employee" ("id", "name", "pin", "role", "storeId")
SELECT DISTINCT
    gen_random_uuid()::text as id,
    COALESCE(u."firstName" || ' ' || u."lastName", u.email, 'Employee') as name,
    u."passwordHash" as pin,
    'TECHNICIAN'::"StoreRole" as role,
    tc."storeId"
FROM "TimeClock" tc
JOIN "User" u ON u.id = tc."userId"
WHERE NOT EXISTS (
    SELECT 1 FROM "Employee" e 
    WHERE e."storeId" = tc."storeId" 
    AND e.pin = u."passwordHash"
)
AND tc."employeeId" IS NULL
ON CONFLICT DO NOTHING;

-- Update TimeClock employeeId again after creating employees
UPDATE "TimeClock" tc
SET "employeeId" = (
    SELECT e.id 
    FROM "Employee" e 
    JOIN "User" u ON u."passwordHash" = e.pin
    WHERE u.id = tc."userId" 
    AND e."storeId" = tc."storeId"
    LIMIT 1
)
WHERE "employeeId" IS NULL;

ALTER TABLE "TimeClock" ALTER COLUMN "employeeId" SET NOT NULL;
ALTER TABLE "TimeClock" DROP CONSTRAINT IF EXISTS "TimeClock_userId_fkey";
ALTER TABLE "TimeClock" DROP COLUMN IF EXISTS "userId";

-- Update Refund
ALTER TABLE "Refund" DROP CONSTRAINT IF EXISTS "Refund_organizationId_fkey";
ALTER TABLE "Refund" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "Refund" ADD COLUMN IF NOT EXISTS "refundedById" TEXT;
-- Map existing refundedById (which is userId) to employeeId
UPDATE "Refund" r
SET "refundedById" = (
    SELECT e.id 
    FROM "Employee" e 
    JOIN "User" u ON u."passwordHash" = e.pin
    WHERE u.id = r."refundedById" 
    AND e."storeId" = r."storeId"
    LIMIT 1
)
WHERE "refundedById" IS NOT NULL 
AND EXISTS (SELECT 1 FROM "User" u WHERE u.id::text = r."refundedById"::text);

ALTER TABLE "Refund" ALTER COLUMN "refundedById" SET NOT NULL;
ALTER TABLE "Refund" DROP CONSTRAINT IF EXISTS "Refund_refundedById_fkey";

-- Update WaiverTemplate
ALTER TABLE "WaiverTemplate" DROP CONSTRAINT IF EXISTS "WaiverTemplate_organizationId_fkey";
ALTER TABLE "WaiverTemplate" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "WaiverTemplate" ADD COLUMN IF NOT EXISTS "storeId" TEXT;
UPDATE "WaiverTemplate" wt SET "storeId" = (SELECT s.id FROM "Store" s WHERE s."organizationId" = wt."organizationId" LIMIT 1) WHERE "storeId" IS NULL;
ALTER TABLE "WaiverTemplate" ALTER COLUMN "storeId" SET NOT NULL;

-- Update Customer
ALTER TABLE "Customer" DROP CONSTRAINT IF EXISTS "Customer_organizationId_fkey";
ALTER TABLE "Customer" DROP COLUMN IF EXISTS "organizationId";

-- Step 8: Add foreign key constraints
ALTER TABLE "Store" ADD CONSTRAINT "Store_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Store" ADD CONSTRAINT "Store_storeEmail_key" UNIQUE ("storeEmail");

ALTER TABLE "Employee" ADD CONSTRAINT "Employee_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_storeId_pin_key" UNIQUE ("storeId", "pin");

ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WaiverTemplate" ADD CONSTRAINT "WaiverTemplate_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TimeClock" ADD CONSTRAINT "TimeClock_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_refundedById_fkey" FOREIGN KEY ("refundedById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 9: Drop old tables
DROP TABLE IF EXISTS "StoreUserRole";
DROP TABLE IF EXISTS "Membership";
DROP TABLE IF EXISTS "Organization";

-- Step 10: Drop organizationId from Store
ALTER TABLE "Store" DROP CONSTRAINT IF EXISTS "Store_organizationId_fkey";
ALTER TABLE "Store" DROP COLUMN IF EXISTS "organizationId";

