"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { inventoryApi, type StockItem } from "@/lib/api/inventory";
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stockItemId: string;
}

export default function POSPage() {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [inventory, setInventory] = useState<StockItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch inventory for the user's store
        const inventoryData = await inventoryApi.findAll();
        setInventory(inventoryData);
      } catch (err: any) {
        console.error("Error fetching POS data:", err);
        setError(err.message || "Failed to load POS data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const filteredItems = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (item: StockItem) => {
    // Safely coerce unitPrice to a number
    const rawPrice =
      typeof item.unitPrice === "number"
        ? item.unitPrice
        : item.unitPrice != null
        ? Number(item.unitPrice as any)
        : undefined;

    if (!rawPrice || Number.isNaN(rawPrice) || item.quantityOnHand === 0) {
      alert("This item is not available for sale");
      return;
    }

    const existingItem = cart.find((cartItem) => cartItem.stockItemId === item.id);
    if (existingItem) {
      // Check if adding one more would exceed available stock
      if (existingItem.quantity >= item.quantityOnHand) {
        alert(`Only ${item.quantityOnHand} items available in stock`);
        return;
      }
      setCart(
        cart.map((cartItem) =>
          cartItem.stockItemId === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      );
    } else {
      setCart([
        ...cart,
        {
          id: `${item.id}-${Date.now()}`,
          name: item.name,
          price: rawPrice,
          quantity: 1,
          stockItemId: item.id,
        },
      ]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    const cartItem = cart.find((item) => item.id === id);
    if (!cartItem) return;

    const inventoryItem = inventory.find((item) => item.id === cartItem.stockItemId);
    if (!inventoryItem) return;

    const newQuantity = cartItem.quantity + delta;
    if (newQuantity < 1) {
      removeFromCart(id);
      return;
    }

    if (newQuantity > inventoryItem.quantityOnHand) {
      alert(`Only ${inventoryItem.quantityOnHand} items available in stock`);
      return;
    }

    setCart(
      cart.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    setIsProcessing(true);
    try {
      // TODO: Implement sales API integration
      // For now, just show a success message
      alert("Payment processed successfully! (Sales API integration coming soon)");
      
      // Clear cart after successful checkout
      setCart([]);
      setSelectedCustomer(null);
      
      // Refresh inventory to update stock levels (store ID is automatically taken from JWT token)
      const inventoryData = await inventoryApi.findAll();
      setInventory(inventoryData);
    } catch (err: any) {
      console.error("Error processing payment:", err);
      alert(err.message || "Failed to process payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;

  if (isLoading && inventory.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading POS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-[calc(100vh-8rem)] gap-6 lg:grid-cols-3">
      {/* Product Selection */}
      <div className="lg:col-span-2 space-y-4 overflow-y-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">POS Register</h1>
          <p className="mt-2 text-muted-foreground">Select items to add to cart</p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <p className="font-medium text-red-900 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Customer Selection - Placeholder */}
        <div className="rounded-lg border border-border bg-card p-4">
          <label className="mb-2 block text-sm font-medium text-foreground">Customer</label>
          <select
            value={selectedCustomer || ""}
            onChange={(e) => setSelectedCustomer(e.target.value || null)}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Walk-in Customer</option>
            {/* TODO: Add customers API integration */}
          </select>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Product Grid */}
        {filteredItems.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No products available</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredItems.map((item) => {
              const cartItem = cart.find((ci) => ci.stockItemId === item.id);
              const isOutOfStock = !item.unitPrice || item.quantityOnHand === 0;
              
              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-lg border border-border bg-card p-4 transition-all hover:shadow-md",
                    isOutOfStock && "opacity-50"
                  )}
                >
                  <div className="mb-2">
                    <h3 className="font-semibold text-foreground">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                  </div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-foreground">
                      {(() => {
                        const value =
                          typeof item.unitPrice === "number"
                            ? item.unitPrice
                            : item.unitPrice != null
                            ? Number(item.unitPrice as any)
                            : undefined;
                        return typeof value === "number" && !Number.isNaN(value)
                          ? `$${value.toFixed(2)}`
                          : "$0.00";
                      })()}
                    </span>
                    <span
                      className={cn(
                        "text-xs",
                        item.quantityOnHand === 0
                          ? "text-red-500 font-semibold"
                          : item.quantityOnHand <= 5
                          ? "text-orange-500"
                          : "text-muted-foreground"
                      )}
                    >
                      Stock: {item.quantityOnHand}
                    </span>
                  </div>
                  {cartItem && (
                    <div className="mb-2 text-xs text-primary font-medium">
                      In cart: {cartItem.quantity}
                    </div>
                  )}
                  <button
                    onClick={() => addToCart(item)}
                    disabled={isOutOfStock}
                    className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      <div className="flex flex-col space-y-4 rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Cart</h2>
        </div>

        {/* Cart Items */}
        <div className="flex-1 space-y-3 overflow-y-auto">
          {cart.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">Cart is empty</p>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-border p-3"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(() => {
                      const value =
                        typeof item.price === "number"
                          ? item.price
                          : item.price != null
                          ? Number(item.price as any)
                          : 0;
                      return `$${(Number.isNaN(value) ? 0 : value).toFixed(2)} each`;
                    })()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="rounded-lg p-1 text-muted-foreground hover:bg-accent"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium text-foreground">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="rounded-lg p-1 text-muted-foreground hover:bg-accent"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="ml-2 rounded-lg p-1 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Summary */}
        {cart.length > 0 && (
          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tax (8%)</span>
              <span className="font-medium text-foreground">${tax.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2 text-lg font-bold text-foreground">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="mt-4 w-full rounded-lg bg-primary px-4 py-3 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  Process Payment
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
