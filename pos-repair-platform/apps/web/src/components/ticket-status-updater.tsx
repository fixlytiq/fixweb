"use client";

import { useState } from "react";
import { Check, ChevronRight, Loader2, Package, Wrench, Clock, CheckCircle2, XCircle, Info } from "lucide-react";
import { type TicketStatus } from "@/lib/api/tickets";
import { cn } from "@/lib/utils";

const statusFlow: TicketStatus[] = [
  "RECEIVED",
  "IN_PROGRESS",
  "AWAITING_PARTS",
  "READY",
  "COMPLETED",
];

const statusConfig: Record<TicketStatus, {
  label: string;
  icon: typeof Package;
  description: string;
}> = {
  RECEIVED: {
    label: "Received",
    icon: Package,
    description: "Device has been received and is awaiting initial inspection"
  },
  IN_PROGRESS: {
    label: "In Progress",
    icon: Wrench,
    description: "Repair work is currently being performed on the device"
  },
  AWAITING_PARTS: {
    label: "Awaiting Parts",
    icon: Clock,
    description: "Repair is on hold waiting for replacement parts to arrive"
  },
  READY: {
    label: "Ready for Pickup",
    icon: CheckCircle2,
    description: "Repair is complete and device is ready for customer pickup"
  },
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle2,
    description: "Ticket is fully completed, payment received, and closed"
  },
  CANCELLED: {
    label: "Cancelled",
    icon: XCircle,
    description: "Ticket has been cancelled and will not be processed"
  },
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
      <div className="rounded-xl border border-border/40 bg-gradient-to-br from-card to-card/50 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Current Status</p>
            <div className="flex items-center gap-2 mb-2">
              {(() => {
                const Icon = statusConfig[currentStatus].icon;
                return <Icon className="h-5 w-5 text-primary" />;
              })()}
              <p className="text-lg font-semibold text-foreground">
                {statusConfig[currentStatus].label}
              </p>
            </div>
            <div className="flex items-start gap-1.5 mt-2 pt-2 border-t border-border/50">
              <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                {statusConfig[currentStatus].description}
              </p>
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
            <Check className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Next Steps */}
      {nextStatuses.length > 0 && (
        <div className="rounded-xl border border-border/40 bg-gradient-to-br from-card to-card/50 p-4 shadow-sm backdrop-blur-sm">
          <p className="mb-3 text-sm font-semibold text-foreground">Move to Next Stage</p>
          <div className="space-y-2">
            {nextStatuses.map((status, index) => {
              const isUpdatingThis = selectedStatus === status && isUpdating;
              const isFirst = index === 0;
              const StatusIcon = statusConfig[status].icon;

              return (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={isUpdating}
                  className={cn(
                    "flex w-full items-start justify-between rounded-xl border p-3 text-left transition-all hover:shadow-sm",
                    isFirst
                      ? "border-primary/50 bg-primary/5 hover:bg-primary/10 hover:border-primary"
                      : "border-border/40 bg-background/50 hover:bg-accent/50 hover:border-border/60",
                    isUpdatingThis && "opacity-50",
                    isUpdating && !isUpdatingThis && "opacity-50 cursor-not-allowed"
                  )}
                  title={statusConfig[status].description}
                >
                  <div className="flex items-start gap-3 flex-1">
                    {isUpdatingThis ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary mt-0.5" />
                    ) : (
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0",
                          isFirst
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <StatusIcon className="h-4 w-4" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {statusConfig[status].label}
                        </p>
                        {isFirst && (
                          <span className="text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            Next
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {statusConfig[status].description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="rounded-xl border border-border/40 bg-gradient-to-br from-card to-card/50 p-4 shadow-sm backdrop-blur-sm">
        <p className="mb-3 text-sm font-semibold text-foreground">Quick Actions</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleStatusChange("CANCELLED" as TicketStatus)}
            disabled={isUpdating}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200/50 bg-red-50/80 px-3 py-1.5 text-xs font-medium text-red-700 transition-all hover:bg-red-100 hover:border-red-300 hover:shadow-sm disabled:opacity-50 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400"
          >
            <XCircle className="h-3.5 w-3.5" />
            Cancel Ticket
          </button>
          {currentStatus === "IN_PROGRESS" && (
            <button
              onClick={() => handleStatusChange("READY")}
              disabled={isUpdating}
              className="inline-flex items-center gap-1.5 rounded-lg border border-green-200/50 bg-green-50/80 px-3 py-1.5 text-xs font-medium text-green-700 transition-all hover:bg-green-100 hover:border-green-300 hover:shadow-sm disabled:opacity-50 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Mark as Ready
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

