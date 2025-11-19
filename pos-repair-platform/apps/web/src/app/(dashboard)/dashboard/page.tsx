"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { inventoryApi, type StockItem } from "@/lib/api/inventory";
import { storesApi, type Store } from "@/lib/api/stores";
import { ticketsApi, type Ticket, type TicketStatus } from "@/lib/api/tickets";
import { salesApi, type Sale } from "@/lib/api/sales";
import { Ticket, Package, DollarSign, AlertTriangle, TrendingUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<StockItem[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
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
        
        // Fetch all dashboard data in parallel
        const [inventoryData, storesData, ticketsData, salesData] = await Promise.all([
          inventoryApi.findAll().catch(() => []),
          storesApi.findAll().catch(() => []),
          ticketsApi.findAll().catch(() => []),
          salesApi.findAll().catch(() => []),
        ]);

        // Ensure all data is an array (defensive check)
        setInventory(Array.isArray(inventoryData) ? inventoryData : []);
        setStores(Array.isArray(storesData) ? storesData : []);
        setTickets(Array.isArray(ticketsData) ? ticketsData : []);
        setSales(Array.isArray(salesData) ? salesData : []);
      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message || "Failed to load dashboard data");
        // Ensure state is set to empty arrays even on error
        setInventory([]);
        setStores([]);
        setTickets([]);
        setSales([]);
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

  // Calculate open tickets (all statuses except COMPLETED and CANCELLED)
  const openTickets = (tickets || []).filter(
    (ticket) => ticket.status !== 'COMPLETED' && ticket.status !== 'CANCELLED'
  ).length;

  // Calculate completed tickets today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const completedToday = (tickets || []).filter((ticket) => {
    if (ticket.status !== 'COMPLETED' || !ticket.completedAt) return false;
    const completedDate = new Date(ticket.completedAt);
    completedDate.setHours(0, 0, 0, 0);
    return completedDate.getTime() === today.getTime();
  }).length;

  // Calculate total revenue from sales
  const totalRevenue = (sales || [])
    .filter((sale) => sale.paymentStatus === 'PAID')
    .reduce((sum, sale) => sum + Number(sale.total || 0), 0);

  // Calculate revenue change (compare last 7 days vs previous 7 days)
  const now = new Date();
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const previous7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  
  const recentSales = (sales || []).filter((sale) => {
    if (sale.paymentStatus !== 'PAID' || !sale.paidAt) return false;
    const paidDate = new Date(sale.paidAt);
    return paidDate >= last7Days;
  });
  
  const previousSales = (sales || []).filter((sale) => {
    if (sale.paymentStatus !== 'PAID' || !sale.paidAt) return false;
    const paidDate = new Date(sale.paidAt);
    return paidDate >= previous7Days && paidDate < last7Days;
  });
  
  const recentRevenue = recentSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const previousRevenue = previousSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const revenueChange = previousRevenue > 0 
    ? ((recentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
    : recentRevenue > 0 ? '100' : '0';

  // Calculate ticket change (new tickets this week vs last week)
  const ticketsThisWeek = (tickets || []).filter((ticket) => {
    const createdDate = new Date(ticket.createdAt);
    return createdDate >= last7Days;
  }).length;
  
  const ticketsPreviousWeek = (tickets || []).filter((ticket) => {
    const createdDate = new Date(ticket.createdAt);
    return createdDate >= previous7Days && createdDate < last7Days;
  }).length;
  
  const ticketChange = ticketsPreviousWeek > 0
    ? ((ticketsThisWeek - ticketsPreviousWeek) / ticketsPreviousWeek * 100).toFixed(0)
    : ticketsThisWeek > 0 ? '100' : '0';

  const stats = {
    openTickets,
    completedToday,
    totalRevenue,
    lowStockCount: lowStockItems.length,
    revenueChange: revenueChange !== '0' ? `${revenueChange}%` : 'No change',
    ticketChange: ticketChange !== '0' ? `${ticketChange}%` : 'No change',
  };

  const statCards = [
    {
      title: "Open Tickets",
      value: stats.openTickets,
      icon: Ticket,
      change: stats.ticketChange,
      trend: parseFloat(stats.ticketChange) >= 0 ? "up" as const : "down" as const,
      color: "text-blue-600",
    },
    {
      title: "Completed Today",
      value: stats.completedToday,
      icon: Package,
      change: stats.completedToday > 0 ? `+${stats.completedToday}` : "0",
      trend: stats.completedToday > 0 ? "up" as const : "neutral" as const,
      color: "text-green-600",
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      change: stats.revenueChange,
      trend: parseFloat(stats.revenueChange) >= 0 ? "up" as const : "down" as const,
      color: "text-primary",
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockCount,
      icon: AlertTriangle,
      change: stats.lowStockCount > 0 ? "Needs attention" : "All good",
      trend: stats.lowStockCount > 0 ? "down" as const : "up" as const,
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
      <div className="mb-2">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-2 text-base text-muted-foreground">
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
              className="group relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-card to-card/50 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-border/60 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-0.5"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{stat.value}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        stat.trend === "up" ? "text-green-600 dark:text-green-400" : stat.trend === "down" ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground"
                      )}
                    >
                      {stat.change}
                    </span>
                    {stat.trend === "up" && (
                      <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                </div>
                <div className={cn("rounded-xl bg-gradient-to-br p-3.5 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md", 
                  stat.color.includes("blue") ? "from-blue-500/15 to-blue-600/8" :
                  stat.color.includes("green") ? "from-green-500/15 to-green-600/8" :
                  stat.color.includes("orange") ? "from-orange-500/15 to-orange-600/8" :
                  "from-primary/15 to-primary/8"
                )}>
                  <Icon className={cn("h-6 w-6", stat.color)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Tickets */}
        <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-card to-card/50 p-6 shadow-sm backdrop-blur-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Recent Tickets</h2>
            <Link
              href="/tickets"
              className="text-sm font-medium text-primary transition-all hover:text-primary/80 hover:underline hover:underline-offset-4"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {tickets && tickets.length > 0 ? (
              tickets.slice(0, 5).map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className="group block rounded-xl border border-border/40 bg-gradient-to-br from-background to-background/50 p-4 transition-all hover:border-border/60 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{ticket.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {ticket.customer 
                          ? `${ticket.customer.firstName || ''} ${ticket.customer.lastName || ''}`.trim() || 'Customer'
                          : 'Walk-in'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-1 text-xs font-medium",
                          ticket.status === 'COMPLETED' 
                            ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                            : ticket.status === 'CANCELLED'
                            ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                        )}
                      >
                        {ticket.status.replace('_', ' ')}
                      </span>
                      {ticket.total && (
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          ${Number(ticket.total).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No tickets yet</p>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-card to-card/50 p-6 shadow-sm backdrop-blur-sm">
          <h2 className="mb-6 text-lg font-semibold text-foreground">Low Stock Alerts</h2>
          <div className="space-y-3">
            {lowStockItems.length > 0 ? (
              lowStockItems.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-orange-200/40 bg-gradient-to-r from-orange-50/60 via-orange-50/40 to-orange-50/20 p-4 transition-all hover:border-orange-300/60 hover:shadow-lg hover:shadow-orange-500/10 hover:-translate-y-0.5 dark:border-orange-800/40 dark:from-orange-950/40 dark:via-orange-950/30 dark:to-orange-950/20"
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
