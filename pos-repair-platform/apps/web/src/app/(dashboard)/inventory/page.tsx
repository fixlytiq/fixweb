"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { inventoryApi, type StockItem, type CreateStockItemDto, type UpdateStockItemDto, type Category } from "@/lib/api/inventory";
import { categoriesApi } from "@/lib/api/categories";
import { Plus, Search, Package, AlertTriangle, Edit, X, Loader2, Trash2, Filter, FolderPlus, Folder } from "lucide-react";
import { cn } from "@/lib/utils";

export default function InventoryPage() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<StockItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isManageCategoriesModalOpen, setIsManageCategoriesModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch categories and inventory in parallel
        const [categoriesData, inventoryData] = await Promise.all([
          categoriesApi.findAll().catch(() => []),
          inventoryApi.findAll(),
        ]);
        
        setCategories(categoriesData);
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
    // Check if user has permission (OWNER or MANAGER)
    if (user && user.role !== 'OWNER' && user.role !== 'MANAGER') {
      alert("You do not have permission to create inventory items. Only Store Owners and Managers can create items.");
      return;
    }

    try {
      // Store ID is automatically taken from JWT token
      const newItem = await inventoryApi.create(data);
      setInventory([...inventory, newItem]);
      setIsModalOpen(false);
      // Refresh categories in case a new one was created
      const categoriesData = await categoriesApi.findAll().catch(() => []);
      setCategories(categoriesData);
    } catch (err: any) {
      console.error("Error creating item:", err);
      
      // Handle different error types
      if (err.statusCode === 401) {
        alert("Your session has expired. Please log in again.");
        window.location.href = '/login';
        return;
      }
      
      if (err.statusCode === 403) {
        alert("You do not have permission to create inventory items. Only Store Owners and Managers can create items.");
        return;
      }
      
      alert(err.message || "Failed to create item");
    }
  };

  const handleUpdateItem = async (id: string, data: CreateStockItemDto) => {
    // Check if user has permission (OWNER or MANAGER)
    if (user && user.role !== 'OWNER' && user.role !== 'MANAGER') {
      alert("You do not have permission to update inventory items. Only Store Owners and Managers can update items.");
      return;
    }

    try {
      // Only send fields that are allowed in UpdateStockItemDto
      const updateData: UpdateStockItemDto = {
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        unitCost: data.unitCost,
        unitPrice: data.unitPrice,
        reorderPoint: data.reorderPoint,
        quantityOnHand: data.initialQuantity,
      };
      const updatedItem = await inventoryApi.update(id, updateData);
      setInventory(inventory.map((item) => (item.id === id ? updatedItem : item)));
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      console.error("Error updating item:", err);
      
      // Handle different error types
      if (err.statusCode === 401) {
        alert("Your session has expired. Please log in again.");
        // The api-client already clears the token, so we just need to redirect
        window.location.href = '/login';
        return;
      }
      
      if (err.statusCode === 403) {
        alert("You do not have permission to update inventory items. Only Store Owners and Managers can update items.");
        return;
      }
      
      alert(err.message || "Failed to update item");
    }
  };

  const handleDeleteItem = async (item: StockItem) => {
    // Check if user has permission (OWNER or MANAGER)
    if (user && user.role !== 'OWNER' && user.role !== 'MANAGER') {
      alert("You do not have permission to delete inventory items. Only Store Owners and Managers can delete items.");
      return;
    }

    if (!confirm(`Are you sure you want to delete ${item.name}?`)) {
      return;
    }

    try {
      await inventoryApi.remove(item.id);
      setInventory(inventory.filter((i) => i.id !== item.id));
    } catch (err: any) {
      console.error("Error deleting item:", err);
      
      // Handle different error types
      if (err.statusCode === 401) {
        alert("Your session has expired. Please log in again.");
        window.location.href = '/login';
        return;
      }
      
      if (err.statusCode === 403) {
        alert("You do not have permission to delete inventory items. Only Store Owners and Managers can delete items.");
        return;
      }
      
      alert(err.message || "Failed to delete item");
    }
  };

  const handleCreateCategory = async (data: { name: string; description?: string }) => {
    try {
      const newCategory = await categoriesApi.create(data);
      setCategories([...categories, newCategory]);
      setIsCategoryModalOpen(false);
    } catch (err: any) {
      console.error("Error creating category:", err);
      alert(err.message || "Failed to create category");
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    // Check if user has permission (OWNER or MANAGER)
    if (user && user.role !== 'OWNER' && user.role !== 'MANAGER') {
      alert("You do not have permission to delete categories. Only Store Owners and Managers can delete categories.");
      return;
    }

    // Check if category has items
    const itemsInCategory = inventory.filter(item => item.categoryId === category.id);
    if (itemsInCategory.length > 0) {
      alert(`Cannot delete category "${category.name}" because it contains ${itemsInCategory.length} item(s). Please reassign or remove those items first.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
      return;
    }

    try {
      await categoriesApi.remove(category.id);
      setCategories(categories.filter((c) => c.id !== category.id));
      // If the deleted category was selected, reset to "ALL"
      if (selectedCategoryId === category.id) {
        setSelectedCategoryId("ALL");
      }
    } catch (err: any) {
      console.error("Error deleting category:", err);
      
      // Handle different error types
      if (err.statusCode === 401) {
        alert("Your session has expired. Please log in again.");
        window.location.href = '/login';
        return;
      }
      
      if (err.statusCode === 403) {
        alert("You do not have permission to delete categories. Only Store Owners and Managers can delete categories.");
        return;
      }
      
      alert(err.message || "Failed to delete category");
    }
  };

  const filteredItems = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory =
      selectedCategoryId === "ALL" || item.categoryId === selectedCategoryId;
    
    return matchesSearch && matchesCategory;
  });

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
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Inventory</h1>
          <p className="mt-2 text-base text-muted-foreground">
            Manage stock items and track inventory levels
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(user?.role === 'OWNER' || user?.role === 'MANAGER') && (
            <>
              <button
                onClick={() => setIsManageCategoriesModalOpen(true)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border/40 bg-gradient-to-br from-background to-background/80 px-4 text-sm font-medium text-foreground shadow-sm backdrop-blur-sm transition-all hover:border-border/60 hover:bg-accent hover:shadow-md hover:shadow-primary/5"
              >
                <Folder className="h-4 w-4" />
                Manage Categories
              </button>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setIsModalOpen(true);
                }}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-4 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:from-primary/90 hover:to-primary/80 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
            </>
          )}
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

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full rounded-xl border border-border/40 bg-background/80 backdrop-blur-sm pl-10 pr-4 text-sm shadow-sm transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-0"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="h-11 rounded-xl border border-border/40 bg-background/80 backdrop-blur-sm pl-10 pr-8 text-sm shadow-sm transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 appearance-none"
          >
            <option value="ALL">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
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
                  "group relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl",
                  isLowStock
                    ? "border-orange-200/40 bg-gradient-to-br from-orange-50/60 via-orange-50/40 to-orange-50/20 shadow-sm hover:border-orange-300/60 hover:shadow-orange-500/15 dark:border-orange-800/40 dark:from-orange-950/40 dark:via-orange-950/30 dark:to-orange-950/20"
                    : "border-border/40 bg-gradient-to-br from-card to-card/50 shadow-sm backdrop-blur-sm hover:border-border/60 hover:shadow-primary/10"
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
                    {item.category && (
                      <span className="inline-block mb-2 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        {item.category.name}
                      </span>
                    )}
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
                  {(user?.role === 'OWNER' || user?.role === 'MANAGER') && (
                    <button
                      onClick={() => handleDeleteItem(item)}
                      className="ml-2 rounded-lg p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
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
                  {(user?.role === 'OWNER' || user?.role === 'MANAGER') && (
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
                  )}
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
          categories={categories}
          onSave={editingItem ? (data) => handleUpdateItem(editingItem.id, data) : handleCreateItem}
          onClose={() => {
            setIsModalOpen(false);
            setEditingItem(null);
          }}
          onCreateCategory={() => {
            setIsModalOpen(false);
            setIsCategoryModalOpen(true);
          }}
        />
      )}

      {/* Create Category Modal */}
      {isCategoryModalOpen && (
        <CategoryModal
          onSave={handleCreateCategory}
          onClose={() => setIsCategoryModalOpen(false)}
        />
      )}

      {/* Manage Categories Modal */}
      {isManageCategoriesModalOpen && (
        <ManageCategoriesModal
          categories={categories}
          inventory={inventory}
          onDelete={handleDeleteCategory}
          onCreate={() => {
            setIsManageCategoriesModalOpen(false);
            setIsCategoryModalOpen(true);
          }}
          onClose={() => setIsManageCategoriesModalOpen(false)}
        />
      )}
    </div>
  );
}

interface InventoryItemModalProps {
  item: StockItem | null;
  categories: Category[];
  onSave: (data: CreateStockItemDto) => void;
  onClose: () => void;
  onCreateCategory?: () => void;
}

function InventoryItemModal({
  item,
  categories,
  onSave,
  onClose,
  onCreateCategory,
}: InventoryItemModalProps) {
  const [formData, setFormData] = useState<CreateStockItemDto>({
    sku: item?.sku || "",
    name: item?.name || "",
    description: item?.description || "",
    categoryId: item?.categoryId || "",
    unitCost: item?.unitCost ? Number(item.unitCost) : undefined,
    unitPrice: item?.unitPrice ? Number(item.unitPrice) : undefined,
    reorderPoint: item?.reorderPoint ? Number(item.reorderPoint) : undefined,
    initialQuantity: item?.quantityOnHand || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
      alert("Please select a category");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-2xl border border-border/40 bg-gradient-to-br from-card via-card to-card/95 shadow-2xl max-h-[90vh] flex flex-col backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
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

        <form id="inventory-item-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              SKU <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={!!item}
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
              title={item ? "SKU cannot be changed after creation" : ""}
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

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            {categories.length === 0 ? (
              <div className="rounded-lg border border-border bg-background p-3 text-sm">
                <p className="text-muted-foreground mb-2">No categories available. Please create one first.</p>
                <button
                  type="button"
                  onClick={onCreateCategory}
                  className="text-primary hover:underline text-sm font-medium"
                >
                  Create Category
                </button>
              </div>
            ) : (
              <select
                required
                value={formData.categoryId || ""}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            )}
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
                {item ? "Quantity on Hand" : "Initial Quantity"}
              </label>
              <input
                type="number"
                min="0"
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
        </form>

        <div className="flex gap-3 p-6 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="inventory-item-form"
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {item ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface CategoryModalProps {
  onSave: (data: { name: string; description?: string }) => void;
  onClose: () => void;
}

function CategoryModal({ onSave, onClose }: CategoryModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Please enter a category name");
      return;
    }
    onSave({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-2xl border border-border/40 bg-gradient-to-br from-card via-card to-card/95 p-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Create Category</h2>
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
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Screen, Battery, Charger"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description for this category"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
            />
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
              Create Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ManageCategoriesModalProps {
  categories: Category[];
  inventory: StockItem[];
  onDelete: (category: Category) => void;
  onCreate: () => void;
  onClose: () => void;
}

function ManageCategoriesModal({
  categories,
  inventory,
  onDelete,
  onCreate,
  onClose,
}: ManageCategoriesModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-border/40 bg-gradient-to-br from-card via-card to-card/95 p-6 shadow-2xl max-h-[80vh] overflow-y-auto backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Manage Categories
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-8">
            <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No categories yet</p>
            <button
              onClick={onCreate}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <FolderPlus className="h-4 w-4" />
              Create First Category
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex justify-end">
              <button
                onClick={onCreate}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <FolderPlus className="h-4 w-4" />
                Add Category
              </button>
            </div>
            <div className="space-y-2">
              {categories.map((category) => {
                const itemsInCategory = inventory.filter(item => item.categoryId === category.id).length;
                return (
                  <div
                    key={category.id}
                    className="flex items-center justify-between rounded-xl border border-border/40 bg-gradient-to-br from-background to-background/80 p-4 backdrop-blur-sm transition-all hover:border-border/60 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground">{category.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({itemsInCategory} item{itemsInCategory !== 1 ? 's' : ''})
                        </span>
                      </div>
                      {category.description && (
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => onDelete(category)}
                      className="ml-4 rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete category"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
