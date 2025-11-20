"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, MoreVertical, Loader2, AlertCircle, Package, Wrench, Clock, CheckCircle2, XCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ticketsApi, type Ticket, type TicketStatus } from "@/lib/api/tickets";
import { employeesApi } from "@/lib/api/employees";
import { useAuth } from "@/contexts/auth-context";

const statusConfig: Record<TicketStatus, { 
  label: string; 
  color: string; 
  icon: typeof Package;
  description: string;
}> = {
  RECEIVED: {
    label: "Received",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    icon: Package,
    description: "Device received, awaiting inspection"
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    icon: Wrench,
    description: "Repair work in progress"
  },
  AWAITING_PARTS: {
    label: "Awaiting Parts",
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    icon: Clock,
    description: "Waiting for parts to arrive"
  },
  READY: {
    label: "Ready for Pickup",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    icon: CheckCircle2,
    description: "Repair complete, ready for customer"
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    icon: CheckCircle2,
    description: "Ticket fully completed and closed"
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    icon: XCircle,
    description: "Ticket has been cancelled"
  },
};

export default function TicketsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "ALL">("ALL");
  const [technicianFilter, setTechnicianFilter] = useState<string>("ALL");
  const [employees, setEmployees] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.warn('TicketsPage: User not authenticated, redirecting to login');
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch tickets with filters
        const status = statusFilter !== "ALL" ? statusFilter : undefined;
        const technicianId = technicianFilter !== "ALL" ? technicianFilter : undefined;
        const ticketsData = await ticketsApi.findAll(status, technicianId);
        setTickets(ticketsData);

        // Fetch employees for filter dropdown
        try {
          const employeesData = await employeesApi.findAll();
          setEmployees(employeesData);
        } catch (err) {
          // Employees API might require OWNER/MANAGER role, ignore if fails
          console.warn("Could not fetch employees:", err);
        }
      } catch (err: any) {
        console.error("Error fetching tickets:", err);
        if (err.statusCode === 404 || err.message?.includes("Cannot GET")) {
          setError("Tickets endpoint not found. Please ensure the backend server has been restarted after adding the Tickets module.");
        } else if (err.statusCode === 401 || err.message === "Unauthorized" || err.message?.includes("Unauthorized")) {
          console.warn('TicketsPage: Unauthorized error - clearing auth and redirecting');
          // Clear tokens and redirect to login immediately
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
          }
          // Use window.location for immediate redirect
          window.location.href = '/login';
          return; // Exit early to prevent state updates
        } else {
          setError(err.message || "Failed to load tickets");
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch data if authenticated
    if (isAuthenticated && !authLoading) {
      fetchData();
    } else if (!authLoading && !isAuthenticated) {
      // If auth is done loading and user is not authenticated, show error
      setError("Please log in to view tickets");
      setIsLoading(false);
    }
  }, [statusFilter, technicianFilter, isAuthenticated, authLoading]);

  // Filter tickets by search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTickets(tickets);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = tickets.filter(
      (ticket) =>
        ticket.title.toLowerCase().includes(query) ||
        ticket.description?.toLowerCase().includes(query) ||
        ticket.customer?.firstName?.toLowerCase().includes(query) ||
        ticket.customer?.lastName?.toLowerCase().includes(query) ||
        ticket.customer?.phone?.includes(query) ||
        ticket.technician?.name?.toLowerCase().includes(query)
    );
    setFilteredTickets(filtered);
  }, [searchQuery, tickets]);

  const formatStatus = (status: TicketStatus) => {
    return statusConfig[status].label;
  };

  const getCustomerName = (ticket: Ticket) => {
    if (!ticket.customer) return "Walk-in";
    const firstName = ticket.customer.firstName || "";
    const lastName = ticket.customer.lastName || "";
    return `${firstName} ${lastName}`.trim() || "Unknown";
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Tickets</h1>
          <p className="mt-2 text-base text-muted-foreground">
            Manage repair tickets and track their status
          </p>
        </div>
        <Link
          href="/tickets/new"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-4 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:from-primary/90 hover:to-primary/80 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" />
          New Ticket
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="font-medium text-red-900 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tickets by title, description, customer, or technician..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 w-full rounded-xl border border-border/40 bg-background/80 backdrop-blur-sm pl-10 pr-4 text-sm shadow-sm transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-0"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border/40 bg-gradient-to-br from-background to-background/80 px-4 text-sm font-medium shadow-sm backdrop-blur-sm transition-all hover:border-border/60 hover:bg-accent hover:shadow-md hover:shadow-primary/5"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-4 rounded-2xl border border-border/40 bg-gradient-to-br from-card to-card/50 p-4 shadow-sm backdrop-blur-sm">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-2 block text-sm font-medium text-foreground">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TicketStatus | "ALL")}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ALL">All Statuses</option>
                <option value="RECEIVED">📦 Received</option>
                <option value="IN_PROGRESS">🔧 In Progress</option>
                <option value="AWAITING_PARTS">⏳ Awaiting Parts</option>
                <option value="READY">✅ Ready for Pickup</option>
                <option value="COMPLETED">✔️ Completed</option>
                <option value="CANCELLED">❌ Cancelled</option>
              </select>
            </div>
            {employees.length > 0 && (
              <div className="flex-1 min-w-[200px]">
                <label className="mb-2 block text-sm font-medium text-foreground">Technician</label>
                <select
                  value={technicianFilter}
                  onChange={(e) => setTechnicianFilter(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="ALL">All Technicians</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tickets Table */}
      <div className="overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-card to-card/50 shadow-sm backdrop-blur-sm">
        {filteredTickets.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== "ALL" || technicianFilter !== "ALL"
                ? "No tickets match your filters."
                : "No tickets yet. Create your first ticket to get started."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Ticket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Technician
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="transition-all hover:bg-muted/20 hover:shadow-sm">
                    <td className="px-6 py-4">
                      <div>
                        <Link
                          href={`/tickets/${ticket.id}`}
                          className="font-medium text-foreground hover:text-primary"
                        >
                          {ticket.title}
                        </Link>
                        {ticket.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {ticket.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {getCustomerName(ticket)}
                        </p>
                        {ticket.customer?.phone && (
                          <p className="text-xs text-muted-foreground">{ticket.customer.phone}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {ticket.technician ? (
                        <span className="text-sm text-foreground">{ticket.technician.name}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="group relative">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-all",
                            statusConfig[ticket.status].color
                          )}
                          title={statusConfig[ticket.status].description}
                        >
                          {(() => {
                            const Icon = statusConfig[ticket.status].icon;
                            return <Icon className="h-3 w-3" />;
                          })()}
                          {formatStatus(ticket.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {ticket.total ? (
                        <span className="text-sm font-semibold text-foreground">
                          ${Number(ticket.total).toFixed(2)}
                        </span>
                      ) : ticket.estimatedCost ? (
                        <span className="text-sm text-muted-foreground">
                          Est: ${Number(ticket.estimatedCost).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      {filteredTickets.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredTickets.length} of {tickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
