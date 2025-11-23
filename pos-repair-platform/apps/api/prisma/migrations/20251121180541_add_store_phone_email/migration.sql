-- AddColumn: Add storePhone and notificationEmail to Store
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "storePhone" TEXT;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "notificationEmail" TEXT;



