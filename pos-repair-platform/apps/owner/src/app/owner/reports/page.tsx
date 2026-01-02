'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { reportsApi } from '@/lib/api';
import { BarChart3, Download, TrendingUp } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { toast } from 'sonner';
import type { ReportSummary, SalesReport, TicketsReport, InventoryLowReport } from '@/lib/types';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: format(startOfDay(subDays(new Date(), 30)), 'yyyy-MM-dd'),
    to: format(endOfDay(new Date()), 'yyyy-MM-dd'),
  });
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [ticketsReport, setTicketsReport] = useState<TicketsReport | null>(null);
  const [inventoryReport, setInventoryReport] = useState<InventoryLowReport | null>(null);

  useEffect(() => {
    loadReports();
  }, [dateRange]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [summaryData, salesData, ticketsData, inventoryData] = await Promise.all([
        reportsApi.summary(dateRange.from, dateRange.to).catch(() => null),
        reportsApi.sales(dateRange.from, dateRange.to).catch(() => null),
        reportsApi.tickets(dateRange.from, dateRange.to).catch(() => null),
        reportsApi.inventoryLow(10).catch(() => null),
      ]);
      setSummary(summaryData);
      setSalesReport(salesData);
      setTicketsReport(ticketsData);
      setInventoryReport(inventoryData);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (type: string) => {
    try {
      let csvContent = '';
      let filename = '';

      switch (type) {
        case 'revenue':
          if (!salesReport) {
            toast.error('No sales data to export');
            return;
          }
          csvContent = 'Date,Revenue\n';
          salesReport.sales.forEach((sale) => {
            csvContent += `${sale.createdAt},${sale.total || 0}\n`;
          });
          filename = `revenue-report-${dateRange.from}-${dateRange.to}.csv`;
          break;
        case 'tickets':
          if (!ticketsReport) {
            toast.error('No tickets data to export');
            return;
          }
          csvContent = 'Ticket ID,Status,Created,Completed\n';
          ticketsReport.tickets.forEach((ticket) => {
            csvContent += `${ticket.id},${ticket.status},${ticket.createdAt},${ticket.completedAt || 'N/A'}\n`;
          });
          filename = `tickets-report-${dateRange.from}-${dateRange.to}.csv`;
          break;
        case 'inventory':
          if (!inventoryReport) {
            toast.error('No inventory data to export');
            return;
          }
          csvContent = 'SKU,Name,Quantity,Reorder Point\n';
          inventoryReport.items.forEach((item) => {
            csvContent += `${item.sku},${item.name},${item.quantityOnHand},${item.reorderPoint || 'N/A'}\n`;
          });
          filename = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`;
          break;
      }

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  // Process sales data for daily revenue chart
  const salesChartData = useMemo(() => {
    if (!salesReport?.sales) return [];
    
    // Group sales by date
    const dailyRevenue: Record<string, number> = {};
    salesReport.sales.forEach((sale) => {
      const date = format(new Date(sale.createdAt), 'yyyy-MM-dd');
      dailyRevenue[date] = (dailyRevenue[date] || 0) + (Number(sale.total) || 0);
    });
    
    // Convert to array and sort by date
    return Object.entries(dailyRevenue)
      .map(([date, revenue]) => ({
        date: format(new Date(date), 'MM/dd'),
        revenue: Number(revenue).toFixed(2),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 days
  }, [salesReport]);

  // Process tickets data for status breakdown
  const ticketsStatusData = useMemo(() => {
    if (!ticketsReport?.tickets) return [];
    
    const statusCount: Record<string, number> = {};
    ticketsReport.tickets.forEach((ticket) => {
      statusCount[ticket.status] = (statusCount[ticket.status] || 0) + 1;
    });
    
    const COLORS = {
      RECEIVED: '#94a3b8',
      IN_PROGRESS: '#3b82f6',
      AWAITING_PARTS: '#f97316',
      READY: '#22c55e',
      COMPLETED: '#8b5cf6',
      CANCELLED: '#ef4444',
    };
    
    return Object.entries(statusCount).map(([status, count]) => ({
      name: status.replace('_', ' '),
      value: count,
      color: COLORS[status as keyof typeof COLORS] || '#94a3b8',
    }));
  }, [ticketsReport]);

  // Process tickets data for daily tickets chart
  const ticketsChartData = useMemo(() => {
    if (!ticketsReport?.tickets) return [];
    
    const dailyTickets: Record<string, { created: number; completed: number }> = {};
    ticketsReport.tickets.forEach((ticket) => {
      const createdDate = format(new Date(ticket.createdAt), 'yyyy-MM-dd');
      if (!dailyTickets[createdDate]) {
        dailyTickets[createdDate] = { created: 0, completed: 0 };
      }
      dailyTickets[createdDate].created += 1;
      
      if (ticket.completedAt) {
        const completedDate = format(new Date(ticket.completedAt), 'yyyy-MM-dd');
        if (!dailyTickets[completedDate]) {
          dailyTickets[completedDate] = { created: 0, completed: 0 };
        }
        dailyTickets[completedDate].completed += 1;
      }
    });
    
    return Object.entries(dailyTickets)
      .map(([date, counts]) => ({
        date: format(new Date(date), 'MM/dd'),
        created: counts.created,
        completed: counts.completed,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30);
  }, [ticketsReport]);

  // Process inventory data for chart
  const inventoryChartData = useMemo(() => {
    if (!inventoryReport?.items) return [];
    
    return inventoryReport.items
      .slice(0, 10) // Top 10 low stock items
      .map((item) => ({
        name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
        quantity: item.quantityOnHand,
        reorderPoint: item.reorderPoint || 0,
      }))
      .sort((a, b) => a.quantity - b.quantity);
  }, [inventoryReport]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Business analytics and insights
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from">From</Label>
              <Input
                id="from"
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Revenue Summary</CardTitle>
                  <CardDescription>
                    Sales performance over time
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => handleExport('revenue')} disabled={!salesReport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : salesReport ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold">${Number(salesReport.totalRevenue).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Sales</p>
                      <p className="text-2xl font-bold">{salesReport.totalSales}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Average Sale</p>
                      <p className="text-2xl font-bold">${Number(salesReport.averageSale).toFixed(2)}</p>
                    </div>
                  </div>
                  {salesChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={salesChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="date" 
                          stroke="hsl(var(--muted-foreground))"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          style={{ fontSize: '12px' }}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px'
                          }}
                          formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                          name="Daily Revenue" 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-64 items-center justify-center text-muted-foreground">
                      <p>No chart data available for the selected date range</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="mx-auto mb-2 h-12 w-12" />
                    <p>No revenue data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Ticket Performance</CardTitle>
                  <CardDescription>
                    Repair ticket analytics
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => handleExport('tickets')} disabled={!ticketsReport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : ticketsReport ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Tickets</p>
                      <p className="text-2xl font-bold">{ticketsReport.totalTickets}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold">{ticketsReport.completedTickets}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Turnaround</p>
                      <p className="text-2xl font-bold">{Number(ticketsReport.averageTurnaround).toFixed(1)} days</p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">
                    Completion Rate: {ticketsReport.totalTickets > 0 ? ((ticketsReport.completedTickets / ticketsReport.totalTickets) * 100).toFixed(1) : 0}%
                  </div>
                  
                  {/* Tickets Status Pie Chart */}
                  {ticketsStatusData.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold">Tickets by Status</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={ticketsStatusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {ticketsStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '6px'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  
                  {/* Daily Tickets Chart */}
                  {ticketsChartData.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold">Tickets Created vs Completed Over Time</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={ticketsChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="date" 
                            stroke="hsl(var(--muted-foreground))"
                            style={{ fontSize: '12px' }}
                          />
                          <YAxis 
                            stroke="hsl(var(--muted-foreground))"
                            style={{ fontSize: '12px' }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '6px'
                            }}
                          />
                          <Legend />
                          <Bar dataKey="created" fill="hsl(var(--primary))" name="Created" />
                          <Bar dataKey="completed" fill="#22c55e" name="Completed" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="mx-auto mb-2 h-12 w-12" />
                    <p>No ticket data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Inventory Report</CardTitle>
                  <CardDescription>
                    Stock levels and low inventory alerts
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => handleExport('inventory')} disabled={!inventoryReport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : inventoryReport ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Low Stock Items</p>
                      <p className="text-2xl font-bold">{inventoryReport.items.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Threshold</p>
                      <p className="text-2xl font-bold">{inventoryReport.threshold}</p>
                    </div>
                  </div>
                  
                  {/* Inventory Bar Chart */}
                  {inventoryChartData.length > 0 ? (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold">Low Stock Items (Top 10)</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart 
                          data={inventoryChartData} 
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis 
                            type="number"
                            stroke="hsl(var(--muted-foreground))"
                            style={{ fontSize: '12px' }}
                          />
                          <YAxis 
                            type="category"
                            dataKey="name"
                            stroke="hsl(var(--muted-foreground))"
                            style={{ fontSize: '12px' }}
                            width={90}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '6px'
                            }}
                            formatter={(value: any, name: string) => {
                              if (name === 'Reorder Point') {
                                return [value, 'Reorder Point'];
                              }
                              return [value, 'Current Stock'];
                            }}
                          />
                          <Legend />
                          <Bar 
                            dataKey="quantity" 
                            fill="#f97316" 
                            name="Current Stock"
                            radius={[0, 4, 4, 0]}
                          />
                          <Bar 
                            dataKey="reorderPoint" 
                            fill="#ef4444" 
                            name="Reorder Point"
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : null}
                  
                  {/* Low Stock Items List */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Low Stock Items Details</h3>
                    {inventoryReport.items.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No low stock items</p>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {inventoryReport.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-muted-foreground">
                                SKU: {item.sku} • Quantity: {item.quantityOnHand}
                                {item.reorderPoint && ` • Reorder at: ${item.reorderPoint}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="mx-auto mb-2 h-12 w-12" />
                    <p>No inventory data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
