import { mockTickets, type TicketStatus } from "@/lib/mock-data";
import { Plus, Search, Filter, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const statusColors: Record<TicketStatus, string> = {
  RECEIVED: "bg-gray-100 text-gray-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  AWAITING_PARTS: "bg-orange-100 text-orange-800",
  READY: "bg-green-100 text-green-800",
  COMPLETED: "bg-purple-100 text-purple-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function TicketsPage() {
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

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tickets..."
            className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent">
          <Filter className="h-4 w-4" />
          Filter
        </button>
      </div>

      {/* Tickets Table */}
      <div className="rounded-lg border border-border bg-card shadow-sm">
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
              {mockTickets.map((ticket) => (
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
                        <p className="text-sm text-muted-foreground">{ticket.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {ticket.customer ? (
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {ticket.customer.firstName} {ticket.customer.lastName}
                        </p>
                        {ticket.customer.phone && (
                          <p className="text-xs text-muted-foreground">{ticket.customer.phone}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Walk-in</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {ticket.technician ? (
                      <span className="text-sm text-foreground">
                        {ticket.technician.firstName} {ticket.technician.lastName}
                      </span>
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
                      {ticket.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {ticket.total ? (
                      <span className="text-sm font-semibold text-foreground">
                        ${ticket.total.toFixed(2)}
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
                    <button className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

