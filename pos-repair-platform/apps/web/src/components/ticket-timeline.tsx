"use client";

import { cn } from "@/lib/utils";
import { Clock, User, CheckCircle2, AlertCircle, Package } from "lucide-react";

export interface TimelineEvent {
  id: string;
  type: "status" | "note" | "assignment" | "parts";
  title: string;
  description?: string;
  timestamp: Date;
  user?: string;
  status?: string;
}

interface TicketTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function TicketTimeline({ events, className }: TicketTimelineProps) {
  const getEventIcon = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "status":
        return <CheckCircle2 className="h-4 w-4" />;
      case "note":
        return <AlertCircle className="h-4 w-4" />;
      case "assignment":
        return <User className="h-4 w-4" />;
      case "parts":
        return <Package className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "status":
        return "bg-primary text-primary-foreground";
      case "note":
        return "bg-blue-500 text-white";
      case "assignment":
        return "bg-purple-500 text-white";
      case "parts":
        return "bg-orange-500 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-lg font-semibold text-foreground">Timeline</h3>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

        {/* Timeline events */}
        <div className="space-y-6">
          {events.map((event, index) => (
            <div key={event.id} className="relative flex gap-4">
              {/* Icon */}
              <div
                className={cn(
                  "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-background",
                  getEventColor(event.type)
                )}
              >
                {getEventIcon(event.type)}
              </div>

              {/* Content */}
              <div className="flex-1 pb-6">
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{event.title}</h4>
                      {event.description && (
                        <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
                      )}
                      {event.user && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          by {event.user}
                        </p>
                      )}
                      {event.status && (
                        <span className="mt-2 inline-block rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                          {event.status}
                        </span>
                      )}
                    </div>
                    <time className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {formatDate(event.timestamp)}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

