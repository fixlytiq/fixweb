"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { inventoryApi, type StockItem } from "@/lib/api/inventory";
import { storesApi, type Store } from "@/lib/api/stores";
import { Ticket, Package, DollarSign, AlertTriangle, TrendingUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<StockItem[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch inventory and stores in parallel
        const [inventoryData, storesData] = await Promise.all([
          inventoryApi.findAll().catch(() => []),
          storesApi.findAll().catch(() => []),
        ]);

        setInventory(inventoryData);
        setStores(storesData);
      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Calculate stats from real data
  const lowStockItems = inventory.filter(
    (item) => item.reorderPoint && item.quantityOnHand <= item.reorderPoint
  );

  const stats = {
    openTickets: 0, // TODO: Implement tickets API
    completedToday: 0, // TODO: Implement tickets API
    totalRevenue: 0, // TODO: Implement sales API
    lowStockCount: lowStockItems.length,
  };

  const statCards = [
    {
      title: "Open Tickets",
      value: stats.openTickets,
      icon: Ticket,
      change: "+12%",
      trend: "up" as const,
      color: "text-blue-600",
    },
    {
      title: "Completed Today",
      value: stats.completedToday,
      icon: Package,
      change: "+5",
      trend: "up" as const,
      color: "text-green-600",
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      change: "+20.1%",
      trend: "up" as const,
      color: "text-primary",
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockCount,
      icon: AlertTriangle,
      change: "Needs attention",
      trend: "down" as const,
      color: "text-orange-600",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <p className="font-medium text-red-900 dark:text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Overview of your repair business performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="rounded-lg border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        stat.trend === "up" ? "text-green-600" : "text-orange-600"
                      )}
                    >
                      {stat.change}
                    </span>
                    {stat.trend === "up" && (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    )}
                  </div>
                </div>
                <div className={cn("rounded-lg bg-primary/10 p-3", stat.color)}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Tickets - Placeholder */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Recent Tickets</h2>
          <p className="text-sm text-muted-foreground">Ticket functionality coming soon...</p>
        </div>

        {/* Low Stock Alert */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Low Stock Alerts</h2>
          <div className="space-y-4">
            {lowStockItems.length > 0 ? (
              lowStockItems.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-4 transition-all hover:shadow-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 dark:border-orange-800 dark:bg-gray-800"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground dark:text-gray-200">{item.name}</p>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-500 dark:text-red-400">
                      {item.quantityOnHand} left
                    </p>
                    {item.reorderPoint && (
                      <p className="text-xs text-muted-foreground dark:text-gray-400">
                        Reorder at {item.reorderPoint}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">All items in stock</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
