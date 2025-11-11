"use client";

import { useState } from "react";
import { mockStockItems, mockCustomers } from "@/lib/mock-data";
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function POSPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = mockStockItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (item: typeof mockStockItems[0]) => {
    const existingItem = cart.find((cartItem) => cartItem.id === item.id);
    if (existingItem) {
      setCart(
        cart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      );
    } else {
      setCart([
        ...cart,
        {
          id: item.id,
          name: item.name,
          price: item.unitPrice || 0,
          quantity: 1,
        },
      ]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(
      cart
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;

  return (
    <div className="grid h-[calc(100vh-8rem)] gap-6 lg:grid-cols-3">
      {/* Product Selection */}
      <div className="lg:col-span-2 space-y-4 overflow-y-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">POS Register</h1>
          <p className="mt-2 text-muted-foreground">Select items to add to cart</p>
        </div>

        {/* Customer Selection */}
        <div className="rounded-lg border border-border bg-card p-4">
          <label className="mb-2 block text-sm font-medium text-foreground">Customer</label>
          <select
            value={selectedCustomer || ""}
            onChange={(e) => setSelectedCustomer(e.target.value || null)}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Walk-in Customer</option>
            {mockCustomers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.firstName} {customer.lastName}
                {customer.phone && ` - ${customer.phone}`}
              </option>
            ))}
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
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-border bg-card p-4 transition-all hover:shadow-md"
            >
              <div className="mb-2">
                <h3 className="font-semibold text-foreground">{item.name}</h3>
                <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
              </div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-lg font-bold text-foreground">
                  ${item.unitPrice?.toFixed(2) || "0.00"}
                </span>
                <span className="text-xs text-muted-foreground">
                  Stock: {item.quantityOnHand}
                </span>
              </div>
              <button
                onClick={() => addToCart(item)}
                disabled={!item.unitPrice || item.quantityOnHand === 0}
                className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
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
                  <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} each</p>
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
            <button className="mt-4 w-full rounded-lg bg-primary px-4 py-3 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90 flex items-center justify-center gap-2">
              <CreditCard className="h-5 w-5" />
              Process Payment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

