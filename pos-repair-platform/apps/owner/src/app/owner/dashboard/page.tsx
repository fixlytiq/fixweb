'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Ticket, Package, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import Link from 'next/link';
import { useReportSummary, useInventoryLowReport } from '@/hooks/use-reports';
import { useTickets } from '@/hooks/use-tickets';

export default function DashboardPage() {
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | 'custom'>('today');
  const [customDateRange, setCustomDateRange] = useState({
    from: format(startOfDay(subDays(new Date(), 7)), 'yyyy-MM-dd'),
    to: format(endOfDay(new Date()), 'yyyy-MM-dd'),
  });

  // Calculate date range based on period
  const dateRange = useMemo(() => {
    const now = new Date();
    let from: string;
    let to: string = format(endOfDay(now), 'yyyy-MM-dd');

    switch (period) {
      case 'today':
        from = format(startOfDay(now), 'yyyy-MM-dd');
        break;
      case '7d':
        from = format(startOfDay(subDays(now, 7)), 'yyyy-MM-dd');
        break;
      case '30d':
        from = format(startOfDay(subDays(now, 30)), 'yyyy-MM-dd');
        break;
      case 'custom':
        from = customDateRange.from;
        to = customDateRange.to;
        break;
      default:
        from = format(startOfDay(subDays(now, 30)), 'yyyy-MM-dd');
    }

    return { from, to };
  }, [period, customDateRange]);

  // React Query hooks - parallel queries with automatic caching
  const { data: summary, isLoading: summaryLoading } = useReportSummary(dateRange.from, dateRange.to);
  const { data: tickets = [], isLoading: ticketsLoading } = useTickets();
  const { data: lowStockData, isLoading: lowStockLoading } = useInventoryLowReport(10);

  const loading = summaryLoading || ticketsLoading || lowStockLoading;
  const recentTickets = tickets.slice(0, 5);
  const lowStock = lowStockData?.items || [];

  const kpis = [
    {
      title: 'Total Revenue',
      value: summary ? `$${summary.totalRevenue != null ? Number(summary.totalRevenue).toFixed(2) : '0.00'}` : '—',
      icon: DollarSign,
      change: '+12.5%',
      description: 'from last period',
    },
    {
      title: 'Open Tickets',
      value: summary?.openTickets || 0,
      icon: Ticket,
      change: `${summary?.completedTickets || 0} completed`,
      description: 'this period',
    },
    {
      title: 'Low Stock Alerts',
      value: lowStock.length,
      icon: Package,
      change: lowStock.length > 0 ? 'Action needed' : 'All good',
      description: 'items below threshold',
    },
    {
      title: 'Labor Hours',
      value: summary ? `${summary.totalLaborHours != null ? Number(summary.totalLaborHours).toFixed(1) : '0'}` : '—',
      icon: Clock,
      change: 'This period',
      description: 'total hours tracked',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your business performance
        </p>
      </div>

      <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="7d">Last 7 Days</TabsTrigger>
          <TabsTrigger value="30d">Last 30 Days</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>

        <TabsContent value={period} className="space-y-6">
          {period === 'custom' && (
            <Card>
              <CardHeader>
                <CardTitle>Custom Date Range</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="from">From</Label>
                    <Input
                      id="from"
                      type="date"
                      value={customDateRange.from}
                      onChange={(e) => setCustomDateRange({ ...customDateRange, from: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="to">To</Label>
                    <Input
                      id="to"
                      type="date"
                      value={customDateRange.to}
                      onChange={(e) => setCustomDateRange({ ...customDateRange, to: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <Card key={kpi.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {kpi.title}
                  </CardTitle>
                  <kpi.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{kpi.value}</div>
                      <p className="text-xs text-muted-foreground">
                        <span className="text-green-600">{kpi.change}</span>{' '}
                        {kpi.description}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Tickets & Alerts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Tickets</CardTitle>
                <CardDescription>Latest repair tickets</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : recentTickets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No tickets found
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recentTickets.map((ticket) => (
                      <Link
                        key={ticket.id}
                        href={`/owner/tickets/${ticket.id}`}
                        className="block"
                      >
                        <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent">
                          <div>
                            <p className="font-medium">{ticket.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {ticket.customer
                                ? `${ticket.customer.firstName || ''} ${ticket.customer.lastName || ''}`.trim()
                                : 'Walk-in'}
                            </p>
                          </div>
                          <Badge variant="outline">{ticket.status}</Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventory Alerts</CardTitle>
                <CardDescription>Items below reorder point</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : lowStock.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>All items are well stocked</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {lowStock.slice(0, 5).map((item: any) => (
                      <Link
                        key={item.id}
                        href="/owner/inventory"
                        className="block"
                      >
                        <div className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-3 transition-colors hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950 dark:hover:bg-orange-900">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantityOnHand} in stock
                            </p>
                          </div>
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

