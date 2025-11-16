"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { storesApi, type Store } from "@/lib/api/stores";
import { ChevronDown, Store as StoreIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StoreSwitcherProps {
  onStoreChange?: (storeId: string) => void;
  className?: string;
}

export function StoreSwitcher({ onStoreChange, className }: StoreSwitcherProps) {
  const { user } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchStores = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const storesData = await storesApi.findAll();
        setStores(storesData);
        
        // Set current store if available (users can only access their own store)
        if (storesData.length > 0 && user) {
          const currentStoreId = user.storeId || storesData[0].id;
          setSelectedStore(currentStoreId);
        }
      } catch (error) {
        console.error("Error fetching stores:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStores();
  }, [user]);

  const handleStoreSelect = (storeId: string) => {
    // Users can only access their own store, so this is just for display
    setSelectedStore(storeId);
    setIsOpen(false);
    if (onStoreChange) {
      onStoreChange(storeId);
    }
  };

  const currentStore = stores.find((s) => s.id === selectedStore);

  if (isLoading) {
    return (
      <div className={cn("inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background", className)}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading stores...</span>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className={cn("inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background", className)}>
        <StoreIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">No stores available</span>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-accent transition-colors"
      >
        <StoreIcon className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">
          {currentStore?.name || "Select Store"}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 z-20 w-64 rounded-lg border border-border bg-card shadow-lg">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                Stores
              </div>
              {stores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => handleStoreSelect(store.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm transition-colors hover:bg-accent",
                    selectedStore === store.id && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <StoreIcon className="h-4 w-4" />
                    <span>{store.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
