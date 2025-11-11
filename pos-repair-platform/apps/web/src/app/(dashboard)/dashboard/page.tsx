import { getDashboardStats, getTicketsByStatus, getLowStockItems } from "@/lib/mock-data";
import { Ticket, Package, DollarSign, AlertTriangle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const stats = getDashboardStats();
  const recentTickets = getTicketsByStatus("IN_PROGRESS").slice(0, 5);
  const lowStockItems = getLowStockItems().slice(0, 5);

  const statCards = [
    {
      title: "Open Tickets",
      value: stats.openTickets,
      icon: Ticket,
      change: "+12%",
      trend: "up",
      color: "text-blue-600",
    },
    {
      title: "Completed Today",
      value: stats.completedToday,
      icon: Package,
      change: "+5",
      trend: "up",
      color: "text-green-600",
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      change: "+20.1%",
      trend: "up",
      color: "text-primary",
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockCount,
      icon: AlertTriangle,
      change: "Needs attention",
      trend: "down",
      color: "text-orange-600",
    },
  ];

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
        {/* Recent Tickets */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Recent Tickets</h2>
          <div className="space-y-4">
            {recentTickets.length > 0 ? (
              recentTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{ticket.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {ticket.customer
                        ? `${ticket.customer.firstName} ${ticket.customer.lastName}`
                        : "Walk-in"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                        ticket.status === "IN_PROGRESS" && "bg-blue-100 text-blue-800",
                        ticket.status === "READY" && "bg-green-100 text-green-800",
                        ticket.status === "AWAITING_PARTS" && "bg-orange-100 text-orange-800"
                      )}
                    >
                      {ticket.status.replace("_", " ")}
                    </span>
                    {ticket.total && (
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        ${ticket.total.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No recent tickets</p>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Low Stock Alerts</h2>
          <div className="space-y-4">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-4"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-orange-600">
                      {item.quantityOnHand} left
                    </p>
                    {item.reorderPoint && (
                      <p className="text-xs text-muted-foreground">
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

