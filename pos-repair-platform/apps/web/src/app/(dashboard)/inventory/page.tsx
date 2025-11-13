import { mockStockItems, getLowStockItems } from "@/lib/mock-data";
import { Plus, Search, Package, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function InventoryPage() {
  const lowStockItems = getLowStockItems();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Inventory</h1>
          <p className="mt-2 text-muted-foreground">
            Manage stock items and track inventory levels
          </p>
        </div>
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Add Item
        </button>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-red-500" />
            <p className="font-medium text-orange-900 dark:text-gray-200">
              {lowStockItems.length} item{lowStockItems.length > 1 ? "s" : ""} running low on stock
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search inventory..."
          className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Inventory Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockStockItems.map((item) => {
          const isLowStock = item.reorderPoint && item.quantityOnHand <= item.reorderPoint;
          return (
            <div
              key={item.id}
              className={cn(
                "rounded-lg border p-6 transition-all hover:shadow-lg",
                isLowStock
                  ? "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-gray-800"
                  : "border-border bg-card"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <h3 className={cn(
                      "font-semibold text-foreground",
                      isLowStock && "dark:text-gray-200"
                    )}>{item.name}</h3>
                  </div>
                  <p className={cn(
                    "mb-2 text-sm text-muted-foreground",
                    isLowStock && "dark:text-gray-400"
                  )}>SKU: {item.sku}</p>
                  {item.description && (
                    <p className={cn(
                      "mb-4 text-sm text-muted-foreground",
                      isLowStock && "dark:text-gray-400"
                    )}>{item.description}</p>
                  )}
                </div>
                {isLowStock && (
                  <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-red-500" />
                )}
              </div>

              <div className="mt-4 space-y-2 border-t border-border pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Quantity on Hand</span>
                  <span className={cn(
                    "font-semibold",
                    isLowStock ? "text-red-500 dark:text-red-400" : "text-foreground"
                  )}>
                    {item.quantityOnHand}
                  </span>
                </div>
                {item.reorderPoint && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Reorder Point</span>
                    <span className="font-semibold text-foreground">{item.reorderPoint}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Unit Cost</span>
                  <span className="font-semibold text-foreground">
                    {item.unitCost ? `$${item.unitCost.toFixed(2)}` : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Unit Price</span>
                  <span className="font-semibold text-foreground">
                    {item.unitPrice ? `$${item.unitPrice.toFixed(2)}` : "—"}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-accent">
                  Edit
                </button>
                <button className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                  Adjust Stock
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

