'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Package, AlertTriangle, Edit, Trash2, PackagePlus, PackageMinus } from 'lucide-react';
import type { StockItem } from '@/lib/types';
import { toast } from 'sonner';
import { useInventory, useCategories, useCreateInventoryItem, useUpdateInventoryItem, useAdjustStock, useDeleteInventoryItem } from '@/hooks/use-inventory';

export default function InventoryPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<StockItem | null>(null);
  const [adjustItem, setAdjustItem] = useState<StockItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<StockItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    categoryId: '',
    unitCost: '',
    unitPrice: '',
    reorderPoint: '',
    quantityOnHand: '0',
  });
  const [adjustData, setAdjustData] = useState({
    quantityChange: '',
    reason: 'ADJUSTMENT',
    note: '',
  });

  // React Query hooks
  const categoryId = selectedCategory !== 'all' ? selectedCategory : undefined;
  const { data: items = [], isLoading: itemsLoading } = useInventory(categoryId);
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const createMutation = useCreateInventoryItem();
  const updateMutation = useUpdateInventoryItem();
  const adjustMutation = useAdjustStock();
  const deleteMutation = useDeleteInventoryItem();

  const loading = itemsLoading || categoriesLoading;

  const handleCreate = () => {
    createMutation.mutate(
      {
        sku: formData.sku,
        name: formData.name,
        description: formData.description || undefined,
        categoryId: formData.categoryId || undefined,
        unitCost: formData.unitCost ? Number(formData.unitCost) : undefined,
        unitPrice: formData.unitPrice ? Number(formData.unitPrice) : undefined,
        reorderPoint: formData.reorderPoint ? Number(formData.reorderPoint) : undefined,
        quantityOnHand: Number(formData.quantityOnHand) || 0,
      },
      {
        onSuccess: () => {
          setCreateOpen(false);
          resetForm();
        },
      }
    );
  };

  const handleEdit = () => {
    if (!editItem) return;
    updateMutation.mutate(
      {
        id: editItem.id,
        data: {
          sku: formData.sku,
          name: formData.name,
          description: formData.description || undefined,
          categoryId: formData.categoryId || undefined,
          unitCost: formData.unitCost ? Number(formData.unitCost) : undefined,
          unitPrice: formData.unitPrice ? Number(formData.unitPrice) : undefined,
          reorderPoint: formData.reorderPoint ? Number(formData.reorderPoint) : undefined,
        },
      },
      {
        onSuccess: () => {
          setEditItem(null);
          resetForm();
        },
      }
    );
  };

  const handleAdjustStock = () => {
    if (!adjustItem) return;
    const quantityChange = Number(adjustData.quantityChange);
    if (isNaN(quantityChange) || quantityChange === 0) {
      toast.error('Quantity change must be a non-zero number');
      return;
    }
    adjustMutation.mutate(
      {
        id: adjustItem.id,
        quantityChange,
        reason: adjustData.reason,
        note: adjustData.note || undefined,
      },
      {
        onSuccess: () => {
          setAdjustItem(null);
          setAdjustData({ quantityChange: '', reason: 'ADJUSTMENT', note: '' });
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    deleteMutation.mutate(deleteItem.id, {
      onSuccess: () => {
        setDeleteItem(null);
      },
    });
  };

  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      description: '',
      categoryId: '',
      unitCost: '',
      unitPrice: '',
      reorderPoint: '',
      quantityOnHand: '0',
    });
  };

  const openEditDialog = (item: StockItem) => {
    setEditItem(item);
    setFormData({
      sku: item.sku,
      name: item.name,
      description: item.description || '',
      categoryId: item.categoryId || '',
      unitCost: item.unitCost?.toString() || '',
      unitPrice: item.unitPrice?.toString() || '',
      reorderPoint: item.reorderPoint?.toString() || '',
      quantityOnHand: item.quantityOnHand.toString(),
    });
  };

  const openAdjustDialog = (item: StockItem) => {
    setAdjustItem(item);
    setAdjustData({ quantityChange: '', reason: 'ADJUSTMENT', note: '' });
  };

  // Items are already filtered by categoryId in the query
  const filteredItems = items;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Manage your stock items and quantities
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Inventory Item</DialogTitle>
              <DialogDescription>
                Create a new stock item
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 px-6 overflow-y-auto flex-1 min-h-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="SKU-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Item Name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Item description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.categoryId || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantityOnHand">Initial Quantity *</Label>
                  <Input
                    id="quantityOnHand"
                    type="number"
                    value={formData.quantityOnHand}
                    onChange={(e) => setFormData({ ...formData, quantityOnHand: e.target.value })}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unitCost">Unit Cost</Label>
                  <Input
                    id="unitCost"
                    type="number"
                    step="0.01"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Unit Price</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorderPoint">Reorder Point</Label>
                  <Input
                    id="reorderPoint"
                    type="number"
                    value={formData.reorderPoint}
                    onChange={(e) => setFormData({ ...formData, reorderPoint: e.target.value })}
                    placeholder="10"
                    min="0"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending || !formData.sku || !formData.name}>
                {createMutation.isPending ? 'Creating...' : 'Create Item'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {categories.length > 0 && (
        <div className="flex items-center gap-2">
          <Label>Filter by Category:</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No inventory items</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {selectedCategory === 'all' ? 'Add your first stock item to get started' : 'No items in this category'}
            </p>
            {selectedCategory === 'all' && (
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </DialogTrigger>
              </Dialog>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Stock Items</CardTitle>
            <CardDescription>
              {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} {selectedCategory !== 'all' && `in ${categories.find(c => c.id === selectedCategory)?.name}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredItems.map((item) => {
                const isLowStock = item.reorderPoint && item.quantityOnHand <= item.reorderPoint;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between rounded-lg border p-4 ${
                      isLowStock ? 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{item.name}</p>
                        {isLowStock && (
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                        )}
                        {item.category && (
                          <Badge variant="outline" className="text-xs">
                            {item.category.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        SKU: {item.sku} • {item.quantityOnHand} in stock
                        {item.reorderPoint && ` • Reorder at ${item.reorderPoint}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.unitPrice != null && (
                        <Badge variant="outline">
                          ${Number(item.unitPrice).toFixed(2)}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAdjustDialog(item)}
                        title="Adjust Stock"
                      >
                        {item.quantityOnHand > 0 ? (
                          <PackageMinus className="h-4 w-4" />
                        ) : (
                          <PackagePlus className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteItem(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Update inventory item information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 overflow-y-auto flex-1 min-h-0">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-sku">SKU *</Label>
                <Input
                  id="edit-sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={formData.categoryId || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-unitCost">Unit Cost</Label>
                <Input
                  id="edit-unitCost"
                  type="number"
                  step="0.01"
                  value={formData.unitCost}
                  onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-unitPrice">Unit Price</Label>
                <Input
                  id="edit-unitPrice"
                  type="number"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-reorderPoint">Reorder Point</Label>
              <Input
                id="edit-reorderPoint"
                type="number"
                value={formData.reorderPoint}
                onChange={(e) => setFormData({ ...formData, reorderPoint: e.target.value })}
                min="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending || !formData.sku || !formData.name}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Stock Dialog */}
      <Dialog open={!!adjustItem} onOpenChange={(open) => !open && setAdjustItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>
              {adjustItem && `Current quantity: ${adjustItem.quantityOnHand}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quantityChange">Quantity Change *</Label>
              <Input
                id="quantityChange"
                type="number"
                value={adjustData.quantityChange}
                onChange={(e) => setAdjustData({ ...adjustData, quantityChange: e.target.value })}
                placeholder="Enter positive to add, negative to remove"
              />
              <p className="text-xs text-muted-foreground">
                Use positive numbers to add stock, negative to remove
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Select
                value={adjustData.reason}
                onValueChange={(value) => setAdjustData({ ...adjustData, reason: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                  <SelectItem value="RECEIVED">Received</SelectItem>
                  <SelectItem value="SOLD">Sold</SelectItem>
                  <SelectItem value="RETURNED">Returned</SelectItem>
                  <SelectItem value="DAMAGED">Damaged</SelectItem>
                  <SelectItem value="LOST">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Input
                id="note"
                value={adjustData.note}
                onChange={(e) => setAdjustData({ ...adjustData, note: e.target.value })}
                placeholder="Optional note about this adjustment"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleAdjustStock} disabled={adjustMutation.isPending || !adjustData.quantityChange}>
              {adjustMutation.isPending ? 'Adjusting...' : 'Adjust Stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteItem?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
