"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { inventoryApi, type StockItem } from "@/lib/api/inventory";
import { ticketsApi, type Ticket } from "@/lib/api/tickets";
import { storesApi, type Store } from "@/lib/api/stores";
import { salesApi } from "@/lib/api/sales";
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Loader2, AlertTriangle, Ticket as TicketIcon, X, Edit2, Percent, DollarSign, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice: number; // Store original price for price override
  quantity: number;
  stockItemId: string;
  discount?: number; // Discount amount (in dollars)
  discountPercent?: number; // Discount percentage
}

export default function POSPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const ticketId = searchParams.get("ticketId");
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [inventory, setInventory] = useState<StockItem[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoadingTicket, setIsLoadingTicket] = useState(false);
  const [isTaxExempt, setIsTaxExempt] = useState(false);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [showPriceDiscountModal, setShowPriceDiscountModal] = useState(false);
  const [modalType, setModalType] = useState<"total" | "item">("total");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState<string>("");
  const [discountInput, setDiscountInput] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch inventory and store data
        const [inventoryData, storesData] = await Promise.all([
          inventoryApi.findAll(),
          storesApi.findAll(),
        ]);
        setInventory(inventoryData);
        if (storesData.length > 0) {
          setStore(storesData[0]);
        }

        // If ticketId is provided, fetch ticket details
        if (ticketId) {
          setIsLoadingTicket(true);
          try {
            const ticketData = await ticketsApi.findOne(ticketId);
            setTicket(ticketData);
            
            // Pre-populate customer if ticket has customer
            if (ticketData.customerId) {
              setSelectedCustomer(ticketData.customerId);
            }

            // Pre-populate cart with ticket total if available
            if (ticketData.total && ticketData.total > 0) {
              // Add a service item representing the repair
              setCart([{
                id: `ticket-${ticketData.id}`,
                name: `Repair Service - ${ticketData.title}`,
                price: ticketData.total,
                originalPrice: ticketData.total,
                quantity: 1,
                stockItemId: "", // No stock item for service
              }]);
            }
          } catch (err: any) {
            console.error("Error fetching ticket:", err);
            if (err.statusCode === 401 || err.message === "Unauthorized" || err.message?.includes("Unauthorized")) {
              console.warn('POSPage: Unauthorized error when fetching ticket - clearing auth and redirecting');
              // Clear tokens and redirect to login immediately
              if (typeof window !== 'undefined') {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
              }
              // Use window.location for immediate redirect
              window.location.href = '/login';
              return; // Exit early to prevent state updates
            }
            // Don't block POS if ticket fetch fails for other reasons
          } finally {
            setIsLoadingTicket(false);
          }
        }
      } catch (err: any) {
        console.error("Error fetching POS data:", err);
        if (err.statusCode === 401 || err.message === "Unauthorized" || err.message?.includes("Unauthorized")) {
          console.warn('POSPage: Unauthorized error - clearing auth and redirecting');
          // Clear tokens and redirect to login immediately
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
          }
          // Use window.location for immediate redirect
          window.location.href = '/login';
          return; // Exit early to prevent state updates
        }
        setError(err.message || "Failed to load POS data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, ticketId]);

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
          originalPrice: rawPrice,
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
      const subtotal = cart.reduce((sum, item) => {
        const itemPrice = item.price - (item.discount || 0);
        return sum + itemPrice * item.quantity;
      }, 0) - totalDiscount;
      
      const taxRate = store?.taxRate || 0.08;
      const tax = isTaxExempt ? 0 : subtotal * taxRate;
      const total = subtotal + tax;

      // Create sale via API
      await salesApi.create({
        ticketId: ticket?.id,
        customerId: selectedCustomer || undefined,
        subtotal: subtotal,
        tax: tax,
        total: total,
        paymentStatus: "PAID",
      });

      const message = ticket 
        ? `Payment processed successfully for ticket "${ticket.title}"!`
        : "Payment processed successfully!";
      alert(message);
      
      // If we came from a ticket, redirect back to ticket detail
      if (ticket) {
        router.push(`/tickets/${ticket.id}`);
        return;
      }
      
      // Clear cart after successful checkout
      setCart([]);
      setSelectedCustomer(null);
      setIsTaxExempt(false);
      setTotalDiscount(0);
      
      // Refresh inventory to update stock levels
      const inventoryData = await inventoryApi.findAll();
      setInventory(inventoryData);
    } catch (err: any) {
      console.error("Error processing payment:", err);
      alert(err.message || "Failed to process payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenPriceDiscountModal = (type: "total" | "item", itemId?: string) => {
    setModalType(type);
    if (type === "total") {
      setDiscountInput(totalDiscount.toFixed(2));
      setEditingItemId(null);
      setPriceInput("");
    } else if (itemId) {
      const item = cart.find(i => i.id === itemId);
      if (item) {
        setEditingItemId(itemId);
        setPriceInput(item.price.toFixed(2));
        setDiscountInput(item.discount ? item.discount.toFixed(2) : "");
      }
    }
    setShowPriceDiscountModal(true);
  };

  const handleSavePriceDiscount = () => {
    if (modalType === "total") {
      const value = parseFloat(discountInput) || 0;
      setTotalDiscount(value >= 0 ? value : 0);
    } else if (editingItemId) {
      const item = cart.find(i => i.id === editingItemId);
      if (item) {
        const newPrice = parseFloat(priceInput) || item.originalPrice;
        const discount = parseFloat(discountInput) || 0;
        setCart(cart.map(cartItem => {
          if (cartItem.id === editingItemId) {
            return {
              ...cartItem,
              price: newPrice,
              discount: discount > 0 ? discount : undefined,
            };
          }
          return cartItem;
        }));
      }
    }
    setShowPriceDiscountModal(false);
    setPriceInput("");
    setDiscountInput("");
    setEditingItemId(null);
  };

  const handleClosePriceDiscountModal = () => {
    setShowPriceDiscountModal(false);
    setPriceInput("");
    setDiscountInput("");
    setEditingItemId(null);
  };

  const removeTicketContext = () => {
    router.push("/pos");
  };

  const subtotal = cart.reduce((sum, item) => {
    const itemPrice = item.price - (item.discount || 0);
    return sum + itemPrice * item.quantity;
  }, 0) - totalDiscount;
  
  const taxRate = store?.taxRate || 0.08;
  const tax = isTaxExempt ? 0 : subtotal * taxRate;
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">POS Register</h1>
            <p className="mt-2 text-base text-muted-foreground">Select items to add to cart</p>
          </div>
          {ticket && (
        <Link
          href={`/tickets/${ticket.id}`}
          className="inline-flex items-center gap-2 rounded-xl border border-border/40 bg-gradient-to-br from-card to-card/80 px-3 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur-sm transition-all hover:border-border/60 hover:bg-accent hover:shadow-md hover:shadow-primary/5"
        >
          <TicketIcon className="h-4 w-4" />
          View Ticket
        </Link>
          )}
        </div>

        {/* Ticket Context Banner */}
        {ticket && (
          <div className="rounded-2xl border border-primary/40 bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 p-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <TicketIcon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Processing Payment for Ticket</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  <strong>Ticket:</strong> {ticket.title}
                </p>
                {ticket.customer && (
                  <p className="text-sm text-muted-foreground mb-1">
                    <strong>Customer:</strong> {ticket.customer.firstName} {ticket.customer.lastName}
                  </p>
                )}
                {ticket.total && (
                  <p className="text-sm text-muted-foreground">
                    <strong>Ticket Total:</strong> ${ticket.total.toFixed(2)}
                  </p>
                )}
              </div>
              <button
                onClick={removeTicketContext}
                className="ml-4 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-background"
                title="Remove ticket context"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <p className="font-medium text-red-900 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Customer Selection - Placeholder */}
        <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-card to-card/50 p-4 shadow-sm backdrop-blur-sm">
          <label className="mb-2 block text-sm font-medium text-foreground">Customer</label>
          <select
            value={selectedCustomer || ""}
            onChange={(e) => setSelectedCustomer(e.target.value || null)}
            className="h-11 w-full rounded-xl border border-border/40 bg-background/80 backdrop-blur-sm px-3 text-sm shadow-sm transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-0"
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
            className="h-11 w-full rounded-xl border border-border/40 bg-background/80 backdrop-blur-sm pl-10 pr-4 text-sm shadow-sm transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-0"
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
                    "group relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-card to-card/50 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-border/60 hover:shadow-xl hover:shadow-primary/10",
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
                    className="w-full rounded-xl bg-gradient-to-r from-primary to-primary/90 px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:from-primary/90 hover:to-primary/80 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm disabled:hover:translate-y-0"
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
      <div className="flex flex-col space-y-4 rounded-2xl border border-border/40 bg-gradient-to-br from-card to-card/50 p-6 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Cart</h2>
        </div>

        {/* Cart Items */}
        <div className="flex-1 space-y-3 overflow-y-auto">
          {cart.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">Cart is empty</p>
          ) : (
            cart.map((item) => {
              const itemPrice = item.price - (item.discount || 0);
              const itemTotal = itemPrice * item.quantity;
              
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-border/40 bg-gradient-to-br from-background to-background/80 p-3 shadow-sm backdrop-blur-sm transition-all hover:border-border/60 hover:shadow-md"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      <div className="mt-1 space-y-0.5">
                        {item.price !== item.originalPrice && (
                          <p className="text-xs text-muted-foreground line-through">
                            ${item.originalPrice.toFixed(2)} each
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          ${itemPrice.toFixed(2)} each
                          {item.discount && item.discount > 0 && (
                            <span className="ml-1 text-green-600">(-${item.discount.toFixed(2)})</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenPriceDiscountModal("item", item.id)}
                      className="rounded-lg p-1 text-muted-foreground hover:bg-accent"
                      title="Edit price or discount"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
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
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        ${itemTotal.toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="rounded-lg p-1 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cart Summary */}
        {cart.length > 0 && (
          <div className="border-t border-border pt-4 space-y-3">
            {/* Tax Exemption Toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/50 p-2">
              <div className="flex items-center gap-2">
                <Ban className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Tax Exempt</span>
              </div>
              <button
                onClick={() => setIsTaxExempt(!isTaxExempt)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  isTaxExempt ? "bg-primary" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    isTaxExempt ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>

            {/* Price & Discount Button */}
            <button
              onClick={() => handleOpenPriceDiscountModal("total")}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-border/40 bg-background/50 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <Edit2 className="h-4 w-4" />
              Price & Discount
              {(totalDiscount > 0 || cart.some(item => item.price !== item.originalPrice || item.discount)) && (
                <span className="ml-auto text-green-600">Modified</span>
              )}
            </button>

            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Tax {isTaxExempt ? "(Exempt)" : `(${(taxRate * 100).toFixed(2)}%)`}
                </span>
                <span className="font-medium text-foreground">${tax.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2 text-lg font-bold text-foreground">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            
            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="w-full rounded-xl bg-gradient-to-r from-primary to-primary/90 px-4 py-3 text-base font-medium text-primary-foreground shadow-sm transition-all hover:from-primary/90 hover:to-primary/80 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm disabled:hover:translate-y-0 flex items-center justify-center gap-2"
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

      {/* Price & Discount Modal */}
      {showPriceDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border/40 bg-gradient-to-br from-card via-card to-card/95 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Edit2 className="h-5 w-5" />
                Edit Prices & Discounts
              </h2>
              <button
                onClick={handleClosePriceDiscountModal}
                className="rounded-lg p-1 text-muted-foreground hover:bg-accent transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Cart Items with Price/Discount Editing */}
              {cart.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">Cart Items</h3>
                  {cart.map((item) => {
                    const currentPrice = item.price.toFixed(2);
                    const currentDiscount = item.discount ? item.discount.toFixed(2) : "";
                    
                    return (
                      <div key={item.id} className="p-4 rounded-xl border border-border/40 bg-background/50 space-y-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Original: ${item.originalPrice.toFixed(2)} × {item.quantity} = ${(item.originalPrice * item.quantity).toFixed(2)}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1.5">
                              Custom Price ($)
                            </label>
                            <div className="relative">
                              <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                defaultValue={currentPrice}
                                onBlur={(e) => {
                                  const newPrice = parseFloat(e.target.value) || item.originalPrice;
                                  setCart(cart.map(cartItem => 
                                    cartItem.id === item.id 
                                      ? { ...cartItem, price: newPrice }
                                      : cartItem
                                  ));
                                }}
                                className="w-full pl-8 pr-3 py-2 rounded-lg border border-border/40 bg-background/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                                placeholder={item.originalPrice.toFixed(2)}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Override price per unit
                            </p>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1.5">
                              Discount ($)
                            </label>
                            <div className="relative">
                              <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                defaultValue={currentDiscount}
                                onBlur={(e) => {
                                  const discount = parseFloat(e.target.value) || 0;
                                  setCart(cart.map(cartItem => 
                                    cartItem.id === item.id 
                                      ? { ...cartItem, discount: discount > 0 ? discount : undefined }
                                      : cartItem
                                  ));
                                }}
                                className="w-full pl-8 pr-3 py-2 rounded-lg border border-border/40 bg-background/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                                placeholder="0.00"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Discount per unit
                            </p>
                          </div>
                        </div>
                        
                        <div className="pt-2 border-t border-border/40">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Current Total:</span>
                            <span className="font-semibold text-foreground">
                              ${((item.price - (item.discount || 0)) * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Total Discount */}
              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-semibold text-foreground mb-3">Total Transaction Discount</h3>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">
                    Total Discount Amount ($)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={totalDiscount.toFixed(2)}
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setTotalDiscount(value >= 0 ? value : 0);
                        setDiscountInput(value.toFixed(2));
                      }}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-border/40 bg-background/80 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    This discount will be applied to the subtotal before tax calculation.
                  </p>
                  {totalDiscount > 0 && (
                    <div className="mt-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <p className="text-xs text-green-700 dark:text-green-300">
                        Current total discount: <span className="font-semibold">${totalDiscount.toFixed(2)}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 pt-4 border-t border-border">
              <button
                type="button"
                onClick={handleClosePriceDiscountModal}
                className="flex-1 rounded-xl border border-border/40 bg-background/80 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
