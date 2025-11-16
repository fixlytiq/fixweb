"use client";

import { cn } from "@/lib/utils";
import { User, Calendar, FileText, Edit, Trash2, Plus, CheckCircle2 } from "lucide-react";

export interface AuditTrailEntry {
  id: string;
  action: string;
  user: string;
  timestamp: Date;
  entityType: string;
  entityId: string;
  changes?: Record<string, { old: any; new: any }>;
  details?: string;
}

interface AuditTrailTableProps {
  entries: AuditTrailEntry[];
  className?: string;
  maxHeight?: string;
}

export function AuditTrailTable({
  entries,
  className,
  maxHeight = "600px",
}: AuditTrailTableProps) {
  const getActionIcon = (action: string) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes("create") || lowerAction.includes("add")) {
      return <Plus className="h-4 w-4 text-green-500" />;
    }
    if (lowerAction.includes("update") || lowerAction.includes("edit")) {
      return <Edit className="h-4 w-4 text-blue-500" />;
    }
    if (lowerAction.includes("delete") || lowerAction.includes("remove")) {
      return <Trash2 className="h-4 w-4 text-destructive" />;
    }
    if (lowerAction.includes("complete") || lowerAction.includes("approve")) {
      return <CheckCircle2 className="h-4 w-4 text-primary" />;
    }
    return <FileText className="h-4 w-4 text-muted-foreground" />;
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

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div
      className={cn("rounded-lg border border-border bg-card overflow-hidden", className)}
      style={{ maxHeight }}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Action
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Entity
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Changes
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No audit trail entries found
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getActionIcon(entry.action)}
                      <span className="text-sm font-medium text-foreground">
                        {entry.action}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm text-foreground">{entry.user}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {entry.entityType}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {entry.entityId}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {entry.changes && Object.keys(entry.changes).length > 0 ? (
                      <div className="space-y-1">
                        {Object.entries(entry.changes).slice(0, 2).map(([key, change]) => (
                          <div key={key} className="text-xs">
                            <span className="font-medium text-foreground">{key}:</span>{" "}
                            <span className="text-muted-foreground line-through">
                              {String(change.old) || "—"}
                            </span>{" "}
                            →{" "}
                            <span className="text-primary font-medium">
                              {String(change.new) || "—"}
                            </span>
                          </div>
                        ))}
                        {Object.keys(entry.changes).length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{Object.keys(entry.changes).length - 2} more
                          </span>
                        )}
                      </div>
                    ) : entry.details ? (
                      <span className="text-xs text-muted-foreground">{entry.details}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <div className="flex flex-col">
                        <span>{formatTimeAgo(entry.timestamp)}</span>
                        <span className="text-[10px]">{formatDate(entry.timestamp)}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

