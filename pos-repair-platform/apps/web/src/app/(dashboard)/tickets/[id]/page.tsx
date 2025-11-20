"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Clock, User, Calendar, Loader2, AlertCircle, Trash2, CreditCard, DollarSign, CheckCircle, XCircle, AlertCircle as AlertCircleIcon, Package, Wrench, CheckCircle2 } from "lucide-react";
import { ticketsApi, type Ticket, type TicketStatus, type TicketNote } from "@/lib/api/tickets";
import { employeesApi, type Employee } from "@/lib/api/employees";
import { salesApi, type Sale } from "@/lib/api/sales";
import { cn } from "@/lib/utils";
import { TicketStatusUpdater } from "@/components/ticket-status-updater";
import { TicketNotes } from "@/components/ticket-notes";
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

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [notes, setNotes] = useState<TicketNote[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const [ticketData, notesData] = await Promise.all([
          ticketsApi.findOne(id),
          ticketsApi.getNotes(id),
        ]);
        
        setTicket(ticketData);
        setNotes(ticketData.notes || notesData);

        // Fetch employees for technician assignment
        try {
          const employeesData = await employeesApi.findAll();
          setEmployees(employeesData);
        } catch (err) {
          console.warn("Could not fetch employees:", err);
        }

        // Fetch sales/payments for this ticket
        try {
          const salesData = await salesApi.findByTicketId(id);
          setSales(salesData || []);
        } catch (err) {
          console.warn("Could not fetch sales:", err);
          setSales([]); // Ensure sales is always an array
          // Don't block the page if sales fetch fails
        }
      } catch (err: any) {
        console.error("Error fetching ticket:", err);
        setError(err.message || "Failed to load ticket");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket) return;

    setIsUpdating(true);
    try {
      const updated = await ticketsApi.update(ticket.id, { status: newStatus });
      setTicket(updated);
    } catch (err: any) {
      console.error("Error updating status:", err);
      alert(err.message || "Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTechnicianChange = async (technicianId: string) => {
    if (!ticket) return;

    setIsUpdating(true);
    try {
      // Debug: Log what we're sending
      if (process.env.NODE_ENV === 'development') {
        console.log('Assigning technician:', {
          technicianId,
          isEmpty: technicianId === '',
          employeesAvailable: employees.length,
          employeeIds: employees.map(e => e.id),
        });
      }

      // Verify the technician exists in the employees list before sending
      if (technicianId && technicianId !== '') {
        const employeeExists = employees.some(emp => emp.id === technicianId);
        if (!employeeExists) {
          alert(`Selected technician is not available. Please refresh the page and try again.`);
          setIsUpdating(false);
          return;
        }
      }

      // Convert empty string to null for unassigning, otherwise use the ID
      const updateData: { technicianId: string | null } = {
        technicianId: technicianId === '' ? null : technicianId
      };
      const updated = await ticketsApi.update(ticket.id, updateData);
      setTicket(updated);
    } catch (err: any) {
      console.error("Error assigning technician:", err);
      const errorMessage = err.message || "Failed to assign technician";
      alert(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!ticket) return;

    setIsUpdating(true);
    try {
      await ticketsApi.remove(ticket.id);
      router.push("/tickets");
    } catch (err: any) {
      console.error("Error deleting ticket:", err);
      alert(err.message || "Failed to delete ticket");
      setIsUpdating(false);
    }
  };

  const refreshNotes = async () => {
    try {
      const notesData = await ticketsApi.getNotes(id);
      setNotes(notesData);
    } catch (err) {
      console.error("Error refreshing notes:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
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
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground">
            {error ? "Error Loading Ticket" : "Ticket Not Found"}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {error || "The ticket you're looking for doesn't exist."}
          </p>
        </div>
      </div>
    );
  }

  const formatStatus = (status: TicketStatus) => {
    return statusConfig[status].label;
  };

  const getCustomerName = () => {
    if (!ticket.customer) return "Walk-in customer";
    const firstName = ticket.customer.firstName || "";
    const lastName = ticket.customer.lastName || "";
    return `${firstName} ${lastName}`.trim() || "Unknown";
  };

  const canDelete = user?.role === "OWNER" || user?.role === "MANAGER" || user?.role === "TECHNICIAN";
  const canAssignTechnician = user?.role === "OWNER" || user?.role === "MANAGER" || user?.role === "TECHNICIAN";

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
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  statusConfig[ticket.status].color
                )}
                title={statusConfig[ticket.status].description}
              >
                {(() => {
                  const Icon = statusConfig[ticket.status].icon;
                  return <Icon className="h-3.5 w-3.5" />;
                })()}
                {formatStatus(ticket.status)}
              </span>
            </div>
            <p className="mt-2 text-muted-foreground">
              Created {new Date(ticket.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(user?.role === "OWNER" || user?.role === "MANAGER" || user?.role === "CASHIER") && (
            <Link
              href={`/pos?ticketId=${ticket.id}`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <CreditCard className="h-4 w-4" />
              Process Payment
            </Link>
          )}
          {canDelete && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isUpdating || ticket.status === "COMPLETED"}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="mb-4 text-sm font-medium text-red-900 dark:text-red-200">
            Are you sure you want to delete this ticket? This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={isUpdating}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {isUpdating ? "Deleting..." : "Delete"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isUpdating}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Description</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
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
                  statusConfig[ticket.status].color
                )}>
                  {(() => {
                    const Icon = statusConfig[ticket.status].icon;
                    return <Icon className="h-4 w-4" />;
                  })()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Status: {formatStatus(ticket.status)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {statusConfig[ticket.status].description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
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

          {/* Notes */}
          <div className="rounded-lg border border-border bg-card p-6">
            <TicketNotes
              ticketId={ticket.id}
              initialNotes={notes}
              onNoteAdded={refreshNotes}
            />
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
                    <p className="font-medium text-foreground">{getCustomerName()}</p>
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
            {canAssignTechnician && employees.length > 0 ? (
              <select
                value={ticket.technicianId || ""}
                onChange={(e) => handleTechnicianChange(e.target.value)}
                disabled={isUpdating}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              >
                <option value="">Unassigned</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
            ) : ticket.technician ? (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{ticket.technician.name}</p>
                  <p className="text-sm text-muted-foreground">{ticket.technician.role}</p>
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
                        ${Number(ticket.estimatedCost).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {ticket.subtotal && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium text-foreground">
                        ${Number(ticket.subtotal).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {ticket.tax && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tax:</span>
                      <span className="font-medium text-foreground">
                        ${Number(ticket.tax).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {ticket.total && (
                    <div className="flex items-center justify-between border-t border-border pt-2 text-base font-bold text-foreground">
                      <span>Total:</span>
                      <span>${Number(ticket.total).toFixed(2)}</span>
                    </div>
                  )}
            </div>
          </div>

          {/* Payment Information */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Payment History</h2>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </div>
            {!sales || sales.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
                <AlertCircleIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No payments recorded for this ticket</p>
                <p className="mt-1 text-xs text-muted-foreground">Click "Process Payment" to record a payment</p>
              </div>
                ) : (
                  <div className="space-y-3">
                    {(sales || []).map((sale) => (
                  <div
                    key={sale.id}
                    className="rounded-lg border border-border bg-muted/30 p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {sale.paymentStatus === "PAID" ? (
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : sale.paymentStatus === "REFUNDED" ? (
                          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        ) : (
                          <AlertCircleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        )}
                        <span
                          className={cn(
                            "text-xs font-medium px-2 py-1 rounded",
                            sale.paymentStatus === "PAID"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                              : sale.paymentStatus === "REFUNDED"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                          )}
                        >
                          {sale.paymentStatus}
                        </span>
                      </div>
                      {sale.reference && (
                        <span className="text-xs text-muted-foreground">Ref: {sale.reference}</span>
                      )}
                    </div>
                        <div className="space-y-1 text-sm">
                          {sale.subtotal && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Subtotal:</span>
                              <span className="font-medium text-foreground">
                                ${Number(sale.subtotal).toFixed(2)}
                              </span>
                            </div>
                          )}
                          {sale.tax && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Tax:</span>
                              <span className="font-medium text-foreground">
                                ${Number(sale.tax).toFixed(2)}
                              </span>
                            </div>
                          )}
                          {sale.total && (
                            <div className="flex items-center justify-between border-t border-border pt-1 font-semibold text-foreground">
                              <span>Total:</span>
                              <span>${Number(sale.total).toFixed(2)}</span>
                            </div>
                          )}
                      {sale.paidAt && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <p className="text-xs text-muted-foreground">
                            Paid: {new Date(sale.paidAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                      {sale.createdAt && !sale.paidAt && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <p className="text-xs text-muted-foreground">
                            Created: {new Date(sale.createdAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {/* Payment Summary */}
                {sales && sales.length > 0 && (
                  <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                      <span>Total Paid:</span>
                          <span>
                            ${(sales || [])
                              .filter((s) => s.paymentStatus === "PAID")
                              .reduce((sum, s) => sum + Number(s.total || 0), 0)
                              .toFixed(2)}
                          </span>
                        </div>
                        {ticket.total && (
                          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                            <span>Ticket Total:</span>
                            <span>${Number(ticket.total).toFixed(2)}</span>
                          </div>
                        )}
                  </div>
                )}
              </div>
            )}
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
