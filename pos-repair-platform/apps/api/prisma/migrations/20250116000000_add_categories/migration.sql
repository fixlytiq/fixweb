-- CreateTable: Categories
CREATE TABLE IF NOT EXISTS "Category" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique category name per store
CREATE UNIQUE INDEX IF NOT EXISTS "Category_storeId_name_key" ON "Category"("storeId", "name");

-- AddForeignKey: Category to Store
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Category_storeId_fkey'
    ) THEN
        ALTER TABLE "Category" ADD CONSTRAINT "Category_storeId_fkey" 
        FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddColumn: Add categoryId to StockItem (nullable first)
ALTER TABLE "StockItem" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;

-- AddForeignKey: StockItem to Category
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'StockItem_categoryId_fkey'
    ) THEN
        ALTER TABLE "StockItem" ADD CONSTRAINT "StockItem_categoryId_fkey" 
        FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- CreateIndex: Index on categoryId for faster queries
CREATE INDEX IF NOT EXISTS "StockItem_categoryId_idx" ON "StockItem"("categoryId");

