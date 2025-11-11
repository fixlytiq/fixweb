"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, X } from "lucide-react";
import { mockCustomers, mockUsers, type TicketStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function NewTicketPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    customerId: "",
    technicianId: "",
    status: "RECEIVED" as TicketStatus,
    estimatedCost: "",
    scheduledAt: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      // In a real app, this would create the ticket via API
      console.log("Ticket created:", formData);
      router.push("/tickets");
    }, 1000);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/tickets"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background transition-colors hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Create New Ticket</h1>
          <p className="mt-2 text-muted-foreground">
            Add a new repair ticket to the system
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Basic Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                    Ticket Title <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., iPhone 14 Screen Repair"
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the issue or repair needed..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-foreground mb-2">
                    Status <span className="text-destructive">*</span>
                  </label>
                  <select
                    id="status"
                    name="status"
                    required
                    value={formData.status}
                    onChange={handleChange}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="RECEIVED">Received</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="AWAITING_PARTS">Awaiting Parts</option>
                    <option value="READY">Ready</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Customer Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="customerId" className="block text-sm font-medium text-foreground mb-2">
                    Customer
                  </label>
                  <select
                    id="customerId"
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleChange}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Walk-in Customer</option>
                    {mockCustomers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.firstName} {customer.lastName}
                        {customer.phone && ` - ${customer.phone}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-lg border border-border bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">
                    Don't see the customer? You can add them later or create a walk-in ticket.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Assignment */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Assignment</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="technicianId" className="block text-sm font-medium text-foreground mb-2">
                    Assign Technician
                  </label>
                  <select
                    id="technicianId"
                    name="technicianId"
                    value={formData.technicianId}
                    onChange={handleChange}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Unassigned</option>
                    {mockUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Pricing</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="estimatedCost" className="block text-sm font-medium text-foreground mb-2">
                    Estimated Cost ($)
                  </label>
                  <input
                    type="number"
                    id="estimatedCost"
                    name="estimatedCost"
                    step="0.01"
                    min="0"
                    value={formData.estimatedCost}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>

            {/* Scheduling */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Scheduling</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="scheduledAt" className="block text-sm font-medium text-foreground mb-2">
                    Scheduled Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    id="scheduledAt"
                    name="scheduledAt"
                    value={formData.scheduledAt}
                    onChange={handleChange}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>

            {/* Form Preview */}
            <div className="rounded-lg border border-border bg-muted/50 p-6">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Preview</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Title:</span>
                  <span className="font-medium text-foreground">
                    {formData.title || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium text-foreground">
                    {formData.status.replace("_", " ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-medium text-foreground">
                    {formData.customerId
                      ? mockCustomers.find((c) => c.id === formData.customerId)?.firstName +
                        " " +
                        mockCustomers.find((c) => c.id === formData.customerId)?.lastName
                      : "Walk-in"}
                  </span>
                </div>
                {formData.estimatedCost && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. Cost:</span>
                    <span className="font-medium text-foreground">
                      ${parseFloat(formData.estimatedCost || "0").toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4 border-t border-border pt-6">
          <Link
            href="/tickets"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent"
          >
            <X className="h-4 w-4" />
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !formData.title}
            className={cn(
              "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50",
              isSubmitting && "cursor-not-allowed"
            )}
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? "Creating..." : "Create Ticket"}
          </button>
        </div>
      </form>
    </div>
  );
}

