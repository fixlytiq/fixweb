"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { inventoryApi, type StockItem, type CreateStockItemDto } from "@/lib/api/inventory";
import { Plus, Search, Package, AlertTriangle, Edit, X, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function InventoryPage() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<StockItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch inventory (store ID is automatically taken from JWT token)
        const inventoryData = await inventoryApi.findAll();
        setInventory(inventoryData);
      } catch (err: any) {
        console.error("Error fetching inventory:", err);
        setError(err.message || "Failed to load inventory");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Note: Store switching removed - users can only access their own store
  // Store ID is automatically taken from JWT token

  const handleCreateItem = async (data: CreateStockItemDto) => {
    try {
      // Store ID is automatically taken from JWT token
      const newItem = await inventoryApi.create(data);
      setInventory([...inventory, newItem]);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Error creating item:", err);
      alert(err.message || "Failed to create item");
    }
  };

  const handleDeleteItem = async (item: StockItem) => {
    if (!confirm(`Are you sure you want to delete ${item.name}?`)) {
      return;
    }

    try {
      await inventoryApi.remove(item.id);
      setInventory(inventory.filter((i) => i.id !== item.id));
    } catch (err: any) {
      console.error("Error deleting item:", err);
      alert(err.message || "Failed to delete item");
    }
  };

  const filteredItems = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockItems = inventory.filter(
    (item) => item.reorderPoint && item.quantityOnHand <= item.reorderPoint
  );

  if (isLoading && inventory.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading inventory...</p>
        </div>
      </div>
    );
  }

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
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="font-medium text-red-900 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

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
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Inventory Grid */}
      {filteredItems.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No inventory items found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
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
                      <h3
                        className={cn(
                          "font-semibold text-foreground",
                          isLowStock && "dark:text-gray-200"
                        )}
                      >
                        {item.name}
                      </h3>
                    </div>
                    <p
                      className={cn(
                        "mb-2 text-sm text-muted-foreground",
                        isLowStock && "dark:text-gray-400"
                      )}
                    >
                      SKU: {item.sku}
                    </p>
                    {item.description && (
                      <p
                        className={cn(
                          "mb-4 text-sm text-muted-foreground",
                          isLowStock && "dark:text-gray-400"
                        )}
                      >
                        {item.description}
                      </p>
                    )}
                  </div>
                  {isLowStock && (
                    <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-red-500" />
                  )}
                  <button
                    onClick={() => handleDeleteItem(item)}
                    className="ml-2 rounded-lg p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 space-y-2 border-t border-border pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Quantity on Hand</span>
                    <span
                      className={cn(
                        "font-semibold",
                        isLowStock ? "text-red-500 dark:text-red-400" : "text-foreground"
                      )}
                    >
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
                      {(() => {
                        const value =
                          typeof item.unitCost === "number"
                            ? item.unitCost
                            : item.unitCost != null
                            ? Number(item.unitCost as any)
                            : undefined;
                        return typeof value === "number" && !Number.isNaN(value)
                          ? `$${value.toFixed(2)}`
                          : "—";
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Unit Price</span>
                    <span className="font-semibold text-foreground">
                      {(() => {
                        const value =
                          typeof item.unitPrice === "number"
                            ? item.unitPrice
                            : item.unitPrice != null
                            ? Number(item.unitPrice as any)
                            : undefined;
                        return typeof value === "number" && !Number.isNaN(value)
                          ? `$${value.toFixed(2)}`
                          : "—";
                      })()}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setIsModalOpen(true);
                    }}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                  >
                    <Edit className="h-4 w-4 inline mr-2" />
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <InventoryItemModal
          item={editingItem}
          onSave={handleCreateItem}
          onClose={() => {
            setIsModalOpen(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}

interface InventoryItemModalProps {
  item: StockItem | null;
  onSave: (data: CreateStockItemDto) => void;
  onClose: () => void;
}

function InventoryItemModal({
  item,
  onSave,
  onClose,
}: InventoryItemModalProps) {
  const [formData, setFormData] = useState<CreateStockItemDto>({
    sku: item?.sku || "",
    name: item?.name || "",
    description: item?.description || "",
    unitCost: item?.unitCost || undefined,
    unitPrice: item?.unitPrice || undefined,
    reorderPoint: item?.reorderPoint || undefined,
    initialQuantity: item?.quantityOnHand || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">
            {item ? "Edit Item" : "Add New Item"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              SKU <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Unit Cost
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.unitCost || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    unitCost: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Unit Price
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.unitPrice || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    unitPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Initial Quantity
              </label>
              <input
                type="number"
                value={formData.initialQuantity || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    initialQuantity: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Reorder Point
              </label>
              <input
                type="number"
                value={formData.reorderPoint || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    reorderPoint: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {item ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
