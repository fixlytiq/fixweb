"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter, MoreVertical, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ticketsApi, type Ticket, type TicketStatus } from "@/lib/api/tickets";
import { employeesApi } from "@/lib/api/employees";

const statusColors: Record<TicketStatus, string> = {
  RECEIVED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  AWAITING_PARTS: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  READY: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  COMPLETED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "ALL">("ALL");
  const [technicianFilter, setTechnicianFilter] = useState<string>("ALL");
  const [employees, setEmployees] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);

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
        } else if (err.statusCode === 401) {
          setError("Unauthorized. Please log in again.");
        } else {
          setError(err.message || "Failed to load tickets");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [statusFilter, technicianFilter]);

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
    return status.replace("_", " ");
  };

  const getCustomerName = (ticket: Ticket) => {
    if (!ticket.customer) return "Walk-in";
    const firstName = ticket.customer.firstName || "";
    const lastName = ticket.customer.lastName || "";
    return `${firstName} ${lastName}`.trim() || "Unknown";
  };

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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Tickets</h1>
          <p className="mt-2 text-muted-foreground">
            Manage repair tickets and track their status
          </p>
        </div>
        <Link
          href="/tickets/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
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
              className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-4 rounded-lg border border-border bg-card p-4">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-2 block text-sm font-medium text-foreground">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TicketStatus | "ALL")}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ALL">All Statuses</option>
                <option value="RECEIVED">Received</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="AWAITING_PARTS">Awaiting Parts</option>
                <option value="READY">Ready</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
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
      <div className="rounded-lg border border-border bg-card shadow-sm">
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
                  <tr key={ticket.id} className="hover:bg-muted/50 transition-colors">
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
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                          statusColors[ticket.status]
                        )}
                      >
                        {formatStatus(ticket.status)}
                      </span>
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
