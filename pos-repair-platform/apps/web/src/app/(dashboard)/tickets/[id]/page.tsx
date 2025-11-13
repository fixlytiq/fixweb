"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Clock, User, Calendar } from "lucide-react";
import { mockTickets, type TicketStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { TicketStatusUpdater } from "@/components/ticket-status-updater";

const statusColors: Record<TicketStatus, string> = {
  RECEIVED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  AWAITING_PARTS: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  READY: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  COMPLETED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  
  const [ticket, setTicket] = useState(() => mockTickets.find((t) => t.id === id));
  
  const handleStatusChange = (newStatus: TicketStatus) => {
    if (ticket) {
      setTicket({
        ...ticket,
        status: newStatus,
        updatedAt: new Date().toISOString(),
        // Update timestamps based on status
        ...(newStatus === "IN_PROGRESS" && !ticket.startedAt && {
          startedAt: new Date().toISOString(),
        }),
        ...(newStatus === "COMPLETED" && !ticket.completedAt && {
          completedAt: new Date().toISOString(),
        }),
      });
    }
  };

  if (!ticket) {
    return (
      <div className="space-y-6">
        <Link
          href="/tickets"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tickets
        </Link>
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <h2 className="text-xl font-semibold text-foreground">Ticket Not Found</h2>
          <p className="mt-2 text-muted-foreground">
            The ticket you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/tickets"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background transition-colors hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {ticket.title}
              </h1>
              <span
                className={cn(
                  "inline-flex rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  statusColors[ticket.status]
                )}
              >
                {ticket.status.replace("_", " ")}
              </span>
            </div>
            <p className="mt-2 text-muted-foreground">
              Created {new Date(ticket.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent">
          <Edit className="h-4 w-4" />
          Edit
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Description</h2>
            <p className="text-sm text-muted-foreground">
              {ticket.description || "No description provided."}
            </p>
          </div>

          {/* Timeline */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Timeline</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Created</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(ticket.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {ticket.startedAt && (
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Started</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(ticket.startedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-4">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full",
                  statusColors[ticket.status]
                )}>
                  <Clock className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Status: {ticket.status.replace("_", " ")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last updated {new Date(ticket.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {ticket.completedAt && (
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Completed</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(ticket.completedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Updater */}
          <TicketStatusUpdater
            currentStatus={ticket.status}
            onStatusChange={handleStatusChange}
          />

          {/* Customer Info */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Customer</h2>
            {ticket.customer ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {ticket.customer.firstName} {ticket.customer.lastName}
                    </p>
                    {ticket.customer.email && (
                      <p className="text-sm text-muted-foreground">{ticket.customer.email}</p>
                    )}
                    {ticket.customer.phone && (
                      <p className="text-sm text-muted-foreground">{ticket.customer.phone}</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Walk-in customer</p>
            )}
          </div>

          {/* Assignment */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Assignment</h2>
            {ticket.technician ? (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {ticket.technician.firstName} {ticket.technician.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{ticket.technician.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Unassigned</p>
            )}
          </div>

          {/* Pricing */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Pricing</h2>
            <div className="space-y-2">
              {ticket.estimatedCost && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Estimated:</span>
                  <span className="font-medium text-foreground">
                    ${ticket.estimatedCost.toFixed(2)}
                  </span>
                </div>
              )}
              {ticket.subtotal && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium text-foreground">
                    ${ticket.subtotal.toFixed(2)}
                  </span>
                </div>
              )}
              {ticket.tax && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tax:</span>
                  <span className="font-medium text-foreground">
                    ${ticket.tax.toFixed(2)}
                  </span>
                </div>
              )}
              {ticket.total && (
                <div className="flex items-center justify-between border-t border-border pt-2 text-base font-bold text-foreground">
                  <span>Total:</span>
                  <span>${ticket.total.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Scheduling */}
          {ticket.scheduledAt && (
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Scheduled</h2>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-foreground">
                  {new Date(ticket.scheduledAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

