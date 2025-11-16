"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, Minus, Trash2, ShoppingCart, CreditCard, X } from "lucide-react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku?: string;
}

interface POSCartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  taxRate?: number;
  className?: string;
}

export function POSCart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  taxRate = 0.08,
  className,
}: POSCartProps) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  return (
    <div className={cn("flex h-full flex-col rounded-lg border border-border bg-card", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border p-4">
        <ShoppingCart className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Cart</h2>
        <span className="ml-auto rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </div>

      {/* Cart Items */}
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {items.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">Cart is empty</p>
              <p className="text-xs text-muted-foreground">Add items to get started</p>
            </div>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-lg border border-border bg-background p-3"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate">{item.name}</h3>
                {item.sku && (
                  <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                )}
                <p className="mt-1 text-sm font-semibold text-foreground">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-lg border border-border">
                  <button
                    onClick={() => onUpdateQuantity(item.id, -1)}
                    className="p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium text-foreground">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, 1)}
                    className="p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-1.5 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer with Totals and Checkout */}
      {items.length > 0 && (
        <div className="border-t border-border p-4 space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tax ({(taxRate * 100).toFixed(0)}%)</span>
              <span className="font-medium text-foreground">${tax.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2">
              <span className="text-base font-semibold text-foreground">Total</span>
              <span className="text-lg font-bold text-primary">${total.toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={onCheckout}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <CreditCard className="h-4 w-4" />
            Checkout
          </button>
        </div>
      )}
    </div>
  );
}

