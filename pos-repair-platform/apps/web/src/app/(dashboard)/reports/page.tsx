"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { reportsApi, type SummaryReport, type SalesReport, type TicketsReport, type InventoryLowReport } from "@/lib/api/reports";
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  Ticket, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  Calendar,
  Loader2,
  Download,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ReportsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'summary' | 'sales' | 'tickets' | 'inventory'>('summary');
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Report data
  const [summary, setSummary] = useState<SummaryReport | null>(null);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [ticketsReport, setTicketsReport] = useState<TicketsReport | null>(null);
  const [inventoryReport, setInventoryReport] = useState<InventoryLowReport | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      return;
    }
    fetchReportData();
  }, [isAuthenticated, authLoading, activeTab, dateRange]);

  const fetchReportData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const from = dateRange.from ? new Date(dateRange.from).toISOString() : undefined;
      const to = dateRange.to ? new Date(dateRange.to + 'T23:59:59').toISOString() : undefined;

      switch (activeTab) {
        case 'summary':
          const summaryData = await reportsApi.getSummary(from, to);
          setSummary(summaryData);
          break;
        case 'sales':
          const salesData = await reportsApi.getSalesReport(from, to);
          setSalesReport(salesData);
          break;
        case 'tickets':
          const ticketsData = await reportsApi.getTicketsReport(from, to);
          setTicketsReport(ticketsData);
          break;
        case 'inventory':
          const inventoryData = await reportsApi.getInventoryLowReport(10);
          setInventoryReport(inventoryData);
          break;
      }
    } catch (err: any) {
      console.error("Error fetching report:", err);
      setError(err.message || "Failed to load report");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatHours = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    return `${hours.toFixed(1)}h`;
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-1">View analytics and insights for your store</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReportData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex items-center gap-4 p-4 bg-card rounded-lg border border-border">
        <Calendar className="h-5 w-5 text-muted-foreground" />
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">From:</label>
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="px-3 py-1.5 rounded-md border border-border bg-background text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">To:</label>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="px-3 py-1.5 rounded-md border border-border bg-background text-sm"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {[
          { id: 'summary', label: 'Summary', icon: BarChart3 },
          { id: 'sales', label: 'Sales', icon: DollarSign },
          { id: 'tickets', label: 'Tickets', icon: Ticket },
          { id: 'inventory', label: 'Low Stock', icon: Package },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          {error}
        </div>
      )}

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : summary ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-6 bg-card rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Total Revenue</h3>
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary.totalSales} sale{summary.totalSales !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="p-6 bg-card rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Open Tickets</h3>
                    <Ticket className="h-5 w-5 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold">{summary.openTickets}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary.completedTickets} completed
                  </p>
                </div>

                <div className="p-6 bg-card rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Low Stock Items</h3>
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                  </div>
                  <p className="text-2xl font-bold">{summary.lowStockItems}</p>
                  <p className="text-xs text-muted-foreground mt-1">Need reordering</p>
                </div>

                <div className="p-6 bg-card rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Total Labor Hours</h3>
                    <Clock className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold">{formatHours(summary.totalLaborHours)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Time tracked</p>
                </div>
              </div>

              {/* Period Info */}
              <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                Report period: {new Date(summary.period.from).toLocaleDateString()} - {new Date(summary.period.to).toLocaleDateString()}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No data available
            </div>
          )}
        </div>
      )}

      {/* Sales Tab */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : salesReport ? (
            <>
              {/* Sales Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 bg-card rounded-lg border border-border">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Revenue</h3>
                  <p className="text-2xl font-bold">{formatCurrency(salesReport.totalRevenue)}</p>
                </div>
                <div className="p-6 bg-card rounded-lg border border-border">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Sales</h3>
                  <p className="text-2xl font-bold">{salesReport.totalSales}</p>
                </div>
                <div className="p-6 bg-card rounded-lg border border-border">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Average Sale</h3>
                  <p className="text-2xl font-bold">{formatCurrency(salesReport.averageSale)}</p>
                </div>
              </div>

              {/* Sales List */}
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold">Sales Details</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Customer</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Ticket</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Amount</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesReport.sales.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                            No sales found for this period
                          </td>
                        </tr>
                      ) : (
                        salesReport.sales.map((sale) => (
                          <tr key={sale.id} className="border-t border-border hover:bg-muted/30">
                            <td className="px-4 py-3 text-sm">
                              {new Date(sale.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {sale.Customer
                                ? `${sale.Customer.firstName || ''} ${sale.Customer.lastName || ''}`.trim() || 'N/A'
                                : 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {sale.Ticket ? (
                                <span className="text-primary">{sale.Ticket.title}</span>
                              ) : (
                                <span className="text-muted-foreground">Standalone</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium">
                              {formatCurrency(sale.total || 0)}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span
                                className={cn(
                                  "px-2 py-1 rounded-full text-xs",
                                  sale.paymentStatus === 'PAID'
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                )}
                              >
                                {sale.paymentStatus}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No data available
            </div>
          )}
        </div>
      )}

      {/* Tickets Tab */}
      {activeTab === 'tickets' && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : ticketsReport ? (
            <>
              {/* Tickets Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 bg-card rounded-lg border border-border">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Tickets</h3>
                  <p className="text-2xl font-bold">{ticketsReport.totalTickets}</p>
                </div>
                <div className="p-6 bg-card rounded-lg border border-border">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Completed</h3>
                  <p className="text-2xl font-bold">{ticketsReport.completedTickets}</p>
                </div>
                <div className="p-6 bg-card rounded-lg border border-border">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Avg Turnaround</h3>
                  <p className="text-2xl font-bold">{formatHours(ticketsReport.averageTurnaround)}</p>
                </div>
              </div>

              {/* Tickets List */}
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold">Tickets Details</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Customer</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Technician</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ticketsReport.tickets.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                            No tickets found for this period
                          </td>
                        </tr>
                      ) : (
                        ticketsReport.tickets.map((ticket) => (
                          <tr key={ticket.id} className="border-t border-border hover:bg-muted/30">
                            <td className="px-4 py-3 text-sm font-medium">{ticket.title}</td>
                            <td className="px-4 py-3 text-sm">
                              {ticket.Customer
                                ? `${ticket.Customer.firstName || ''} ${ticket.Customer.lastName || ''}`.trim() || 'N/A'
                                : 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {ticket.Employee?.name || 'Unassigned'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                {ticket.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No data available
            </div>
          )}
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : inventoryReport ? (
            <>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <p className="text-sm font-medium text-orange-900 dark:text-orange-200">
                    {inventoryReport.items.length} item{inventoryReport.items.length !== 1 ? 's' : ''} below threshold ({inventoryReport.threshold})
                  </p>
                </div>
              </div>

              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold">Low Stock Items</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">SKU</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Quantity</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Reorder Point</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryReport.items.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                            All items are above threshold
                          </td>
                        </tr>
                      ) : (
                        inventoryReport.items.map((item) => (
                          <tr key={item.id} className="border-t border-border hover:bg-muted/30">
                            <td className="px-4 py-3 text-sm font-mono">{item.sku}</td>
                            <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {item.Category?.name || 'Uncategorized'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={cn(
                                "font-medium",
                                item.quantityOnHand <= (item.reorderPoint || 0) && "text-orange-600 dark:text-orange-400"
                              )}>
                                {item.quantityOnHand}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {item.reorderPoint ?? 'N/A'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No data available
            </div>
          )}
        </div>
      )}
    </div>
  );
}

