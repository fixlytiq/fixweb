"use client";

import { useState } from "react";
import { Check, ChevronRight, Loader2 } from "lucide-react";
import { type TicketStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const statusFlow: TicketStatus[] = [
  "RECEIVED",
  "IN_PROGRESS",
  "AWAITING_PARTS",
  "READY",
  "COMPLETED",
];

const statusLabels: Record<TicketStatus, string> = {
  RECEIVED: "Received",
  IN_PROGRESS: "In Progress",
  AWAITING_PARTS: "Awaiting Parts",
  READY: "Ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

interface TicketStatusUpdaterProps {
  currentStatus: TicketStatus;
  onStatusChange: (newStatus: TicketStatus) => void;
}

export function TicketStatusUpdater({
  currentStatus,
  onStatusChange,
}: TicketStatusUpdaterProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | null>(null);

  const currentIndex = statusFlow.indexOf(currentStatus);
  const nextStatuses = statusFlow.slice(currentIndex + 1);

  const handleStatusChange = async (newStatus: TicketStatus) => {
    setSelectedStatus(newStatus);
    setIsUpdating(true);

    // Simulate API call
    setTimeout(() => {
      onStatusChange(newStatus);
      setIsUpdating(false);
      setSelectedStatus(null);
    }, 800);
  };

  if (currentStatus === "COMPLETED" || currentStatus === "CANCELLED") {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">
          This ticket is {currentStatus.toLowerCase()} and cannot be moved to another stage.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Status */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Current Status</p>
            <p className="text-lg font-semibold text-foreground">
              {statusLabels[currentStatus]}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Next Steps */}
      {nextStatuses.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-3 text-sm font-medium text-foreground">Move to Next Stage</p>
          <div className="space-y-2">
            {nextStatuses.map((status, index) => {
              const isUpdatingThis = selectedStatus === status && isUpdating;
              const isFirst = index === 0;

              return (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={isUpdating}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border p-3 text-left transition-all",
                    isFirst
                      ? "border-primary bg-primary/5 hover:bg-primary/10"
                      : "border-border bg-background hover:bg-accent",
                    isUpdatingThis && "opacity-50",
                    isUpdating && !isUpdatingThis && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {isUpdatingThis ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <div
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                          isFirst
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {index + 1}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {statusLabels[status]}
                      </p>
                      {isFirst && (
                        <p className="text-xs text-muted-foreground">Recommended next step</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="mb-3 text-sm font-medium text-foreground">Quick Actions</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleStatusChange("CANCELLED" as TicketStatus)}
            disabled={isUpdating}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400"
          >
            Cancel Ticket
          </button>
          {currentStatus === "IN_PROGRESS" && (
            <button
              onClick={() => handleStatusChange("READY")}
              disabled={isUpdating}
              className="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-100 disabled:opacity-50 dark:border-green-900 dark:bg-green-900/20 dark:text-green-400"
            >
              Mark as Ready
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

