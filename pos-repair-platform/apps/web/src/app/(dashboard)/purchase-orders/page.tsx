"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { purchaseOrdersApi, type PurchaseOrder, type PurchaseOrderStatus, type CreatePurchaseOrderDto, type CreatePurchaseOrderItemDto } from "@/lib/api/purchase-orders";
import { vendorsApi, type Vendor } from "@/lib/api/vendors";
import { inventoryApi, type StockItem } from "@/lib/api/inventory";
import { 
  Plus, 
  Search, 
  FileText, 
  Edit, 
  Trash2, 
  Loader2, 
  X, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Package,
  Send,
  Check,
  Truck,
  XCircle,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig: Record<PurchaseOrderStatus, { 
  label: string; 
  color: string; 
  icon: typeof Package;
}> = {
  DRAFT: {
    label: "Draft",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    icon: FileText,
  },
  SUBMITTED: {
    label: "Submitted",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    icon: Send,
  },
  ORDERED: {
    label: "Ordered",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    icon: CheckCircle2,
  },
  RECEIVED: {
    label: "Received",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    icon: Truck,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    icon: XCircle,
  },
};

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [inventory, setInventory] = useState<StockItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | "ALL">("ALL");
  const [vendorFilter, setVendorFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreatePurchaseOrderDto>({
    vendorId: "",
    reference: "",
    notes: "",
    expectedAt: "",
    items: [],
  });

  // Item form state
  const [itemForm, setItemForm] = useState<CreatePurchaseOrderItemDto>({
    stockItemId: "",
    sku: "",
    description: "",
    quantity: 1,
    unitCost: 0,
    totalCost: 0,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (user && isAuthenticated) {
      fetchData();
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    filterOrders();
  }, [searchQuery, statusFilter, vendorFilter, purchaseOrders]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [ordersData, vendorsData, inventoryData] = await Promise.all([
        purchaseOrdersApi.findAll().catch(() => []),
        vendorsApi.findAll().catch(() => []),
        inventoryApi.findAll().catch(() => []),
      ]);
      setPurchaseOrders(ordersData);
      setVendors(vendorsData);
      setInventory(inventoryData);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...purchaseOrders];

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((po) => po.status === statusFilter);
    }

    if (vendorFilter !== "ALL") {
      filtered = filtered.filter((po) => po.vendorId === vendorFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((po) => {
        const ref = po.reference?.toLowerCase() || "";
        const vendorName = po.Vendor?.name.toLowerCase() || "";
        return ref.includes(query) || vendorName.includes(query);
      });
    }

    setFilteredOrders(filtered);
  };

  const handleOpenModal = (order?: PurchaseOrder) => {
    if (order) {
      setEditingOrder(order);
      setFormData({
        vendorId: order.vendorId || "",
        reference: order.reference || "",
        notes: order.notes || "",
        expectedAt: order.expectedAt ? new Date(order.expectedAt).toISOString().split('T')[0] : "",
        items: order.PurchaseOrderItem.map((item) => ({
          stockItemId: item.stockItemId || "",
          sku: item.sku,
          description: item.description || "",
          quantity: item.quantity,
          unitCost: item.unitCost || 0,
          totalCost: item.totalCost || 0,
        })),
      });
    } else {
      setEditingOrder(null);
      setFormData({
        vendorId: "",
        reference: "",
        notes: "",
        expectedAt: "",
        items: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOrder(null);
    setFormData({
      vendorId: "",
      reference: "",
      notes: "",
      expectedAt: "",
      items: [],
    });
    setItemForm({
      stockItemId: "",
      sku: "",
      description: "",
      quantity: 1,
      unitCost: 0,
      totalCost: 0,
    });
  };

  const handleAddItem = () => {
    if (!itemForm.sku.trim() || itemForm.quantity < 1) {
      alert("Please provide SKU and quantity");
      return;
    }

    const totalCost = itemForm.totalCost || (itemForm.unitCost ? itemForm.unitCost * itemForm.quantity : 0);
    setFormData({
      ...formData,
      items: [...formData.items, { ...itemForm, totalCost }],
    });
    setItemForm({
      stockItemId: "",
      sku: "",
      description: "",
      quantity: 1,
      unitCost: 0,
      totalCost: 0,
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleStockItemChange = (stockItemId: string) => {
    const stockItem = inventory.find((item) => item.id === stockItemId);
    if (stockItem) {
      setItemForm({
        ...itemForm,
        stockItemId: stockItem.id,
        sku: stockItem.sku,
        description: stockItem.name,
        unitCost: stockItem.unitCost || 0,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.items.length === 0) {
      alert("Please add at least one item to the purchase order");
      return;
    }

    try {
      if (editingOrder) {
        await purchaseOrdersApi.update(editingOrder.id, {
          vendorId: formData.vendorId || undefined,
          reference: formData.reference || undefined,
          notes: formData.notes || undefined,
          expectedAt: formData.expectedAt || undefined,
        });
      } else {
        await purchaseOrdersApi.create({
          ...formData,
          vendorId: formData.vendorId || undefined,
        });
      }
      handleCloseModal();
      fetchData();
    } catch (err: any) {
      console.error("Error saving purchase order:", err);
      alert(err.message || "Failed to save purchase order");
    }
  };

  const handleWorkflowAction = async (action: 'submit' | 'approve' | 'receive' | 'cancel', id: string) => {
    try {
      setIsProcessing(id);
      switch (action) {
        case 'submit':
          await purchaseOrdersApi.submit(id);
          break;
        case 'approve':
          await purchaseOrdersApi.approve(id);
          break;
        case 'receive':
          await purchaseOrdersApi.receive(id);
          break;
        case 'cancel':
          await purchaseOrdersApi.cancel(id);
          break;
      }
      fetchData();
    } catch (err: any) {
      console.error(`Error ${action}ing purchase order:`, err);
      alert(err.message || `Failed to ${action} purchase order`);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this purchase order?")) {
      return;
    }

    try {
      setIsProcessing(id);
      await purchaseOrdersApi.remove(id);
      fetchData();
    } catch (err: any) {
      console.error("Error deleting purchase order:", err);
      alert(err.message || "Failed to delete purchase order");
    } finally {
      setIsProcessing(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const calculateTotal = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.totalCost || 0), 0);
    const tax = 0;
    return { subtotal, tax, total: subtotal + tax };
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const canManage = user && (user.role === 'OWNER' || user.role === 'MANAGER');

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Purchase Orders</h1>
          <p className="text-muted-foreground mt-1">Manage vendor purchase orders and inventory restocking</p>
        </div>
        {canManage && (
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Purchase Order
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by reference or vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as PurchaseOrderStatus | "ALL")}
          className="px-4 py-2 rounded-lg border border-border bg-background"
        >
          <option value="ALL">All Statuses</option>
          {Object.keys(statusConfig).map((status) => (
            <option key={status} value={status}>{statusConfig[status as PurchaseOrderStatus].label}</option>
          ))}
        </select>
        <select
          value={vendorFilter}
          onChange={(e) => setVendorFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-border bg-background"
        >
          <option value="ALL">All Vendors</option>
          {vendors.map((vendor) => (
            <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
          ))}
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Purchase Orders List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {searchQuery || statusFilter !== "ALL" || vendorFilter !== "ALL"
              ? "No purchase orders found matching your filters"
              : "No purchase orders yet. Create your first purchase order to get started."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const StatusIcon = statusConfig[order.status].icon;
            return (
              <div
                key={order.id}
                className="p-6 bg-card rounded-lg border border-border hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={cn("px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1", statusConfig[order.status].color)}>
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig[order.status].label}
                      </span>
                      {order.reference && (
                        <span className="text-sm font-mono text-muted-foreground">{order.reference}</span>
                      )}
                    </div>
                    {order.Vendor && (
                      <p className="text-sm text-muted-foreground mb-1">Vendor: {order.Vendor.name}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {order.PurchaseOrderItem.length} item{order.PurchaseOrderItem.length !== 1 ? 's' : ''} • 
                      {order.total && ` Total: ${formatCurrency(order.total)}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created: {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-2">
                      {order.status === 'DRAFT' && (
                        <button
                          onClick={() => handleWorkflowAction('submit', order.id)}
                          disabled={isProcessing === order.id}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 text-sm"
                        >
                          {isProcessing === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit'}
                        </button>
                      )}
                      {order.status === 'SUBMITTED' && (
                        <button
                          onClick={() => handleWorkflowAction('approve', order.id)}
                          disabled={isProcessing === order.id}
                          className="px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 text-sm"
                        >
                          {isProcessing === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve'}
                        </button>
                      )}
                      {order.status === 'ORDERED' && (
                        <button
                          onClick={() => handleWorkflowAction('receive', order.id)}
                          disabled={isProcessing === order.id}
                          className="px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 text-sm"
                        >
                          {isProcessing === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Receive'}
                        </button>
                      )}
                      {order.status !== 'RECEIVED' && order.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleWorkflowAction('cancel', order.id)}
                          disabled={isProcessing === order.id}
                          className="px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 text-sm"
                        >
                          {isProcessing === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancel'}
                        </button>
                      )}
                      {order.status === 'DRAFT' && (
                        <>
                          <button
                            onClick={() => handleOpenModal(order)}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => handleDelete(order.id)}
                            disabled={isProcessing === order.id}
                            className="p-2 rounded-lg hover:bg-destructive/10 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {isProcessing === order.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card rounded-lg border border-border shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="text-xl font-semibold">
                {editingOrder ? "Edit Purchase Order" : "New Purchase Order"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Vendor</label>
                  <select
                    value={formData.vendorId}
                    onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  >
                    <option value="">Select vendor...</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Reference</label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    placeholder="PO-2024-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expected Date</label>
                  <input
                    type="date"
                    value={formData.expectedAt}
                    onChange={(e) => setFormData({ ...formData, expectedAt: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background resize-none"
                  rows={2}
                />
              </div>

              {/* Add Item Form */}
              {!editingOrder && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <h3 className="font-medium">Add Item</h3>
                  <div className="grid grid-cols-6 gap-2">
                    <div className="col-span-2">
                      <select
                        value={itemForm.stockItemId}
                        onChange={(e) => {
                          handleStockItemChange(e.target.value);
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                      >
                        <option value="">Select from inventory...</option>
                        {inventory.map((item) => (
                          <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="text"
                      placeholder="SKU"
                      value={itemForm.sku}
                      onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })}
                      className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={itemForm.quantity}
                      onChange={(e) => {
                        const qty = parseInt(e.target.value) || 1;
                        const total = itemForm.unitCost ? itemForm.unitCost * qty : 0;
                        setItemForm({ ...itemForm, quantity: qty, totalCost: total });
                      }}
                      min="1"
                      className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                      required
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Unit Cost"
                      value={itemForm.unitCost || ''}
                      onChange={(e) => {
                        const cost = parseFloat(e.target.value) || 0;
                        const total = cost * itemForm.quantity;
                        setItemForm({ ...itemForm, unitCost: cost, totalCost: total });
                      }}
                      className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
                    >
                      Add
                    </button>
                  </div>
                  {itemForm.description && (
                    <input
                      type="text"
                      placeholder="Description"
                      value={itemForm.description}
                      onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                    />
                  )}
                </div>
              )}

              {/* Items List */}
              <div>
                <h3 className="font-medium mb-3">Items ({formData.items.length})</h3>
                {formData.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No items added yet</p>
                ) : (
                  <div className="space-y-2">
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{item.sku}</p>
                          {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity} × {formatCurrency(item.unitCost || 0)} = {formatCurrency(item.totalCost || 0)}
                          </p>
                        </div>
                        {!editingOrder && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totals */}
              {formData.items.length > 0 && (
                <div className="border-t border-border pt-4">
                  <div className="flex justify-end space-x-8">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Subtotal</p>
                      <p className="text-lg font-semibold">{formatCurrency(calculateTotal().subtotal)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Tax</p>
                      <p className="text-lg font-semibold">{formatCurrency(calculateTotal().tax)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-xl font-bold">{formatCurrency(calculateTotal().total)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <button
                  type="submit"
                  disabled={formData.items.length === 0}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {editingOrder ? "Update Purchase Order" : "Create Purchase Order"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg border border-border hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

