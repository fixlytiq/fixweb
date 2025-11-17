"use client";

import { useState } from "react";
import { MessageSquare, Send, Loader2, AlertCircle } from "lucide-react";
import { ticketsApi, type TicketNote, type CreateTicketNoteDto } from "@/lib/api/tickets";
import { cn } from "@/lib/utils";

interface TicketNotesProps {
  ticketId: string;
  initialNotes?: TicketNote[];
  onNoteAdded?: () => void;
}

export function TicketNotes({ ticketId, initialNotes = [], onNoteAdded }: TicketNotesProps) {
  const [notes, setNotes] = useState<TicketNote[]>(initialNotes);
  const [newNote, setNewNote] = useState("");
  const [visibility, setVisibility] = useState<"INTERNAL" | "CUSTOMER">("INTERNAL");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const note = await ticketsApi.addNote(ticketId, {
        body: newNote,
        visibility,
      });
      setNotes([note, ...notes]);
      setNewNote("");
      onNoteAdded?.();
    } catch (err: any) {
      console.error("Error adding note:", err);
      setError(err.message || "Failed to add note");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Notes</h2>
        <span className="text-sm text-muted-foreground">({notes.length})</span>
      </div>

      {/* Add Note Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note..."
            rows={3}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={isSubmitting}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as "INTERNAL" | "CUSTOMER")}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={isSubmitting}
          >
            <option value="INTERNAL">Internal</option>
            <option value="CUSTOMER">Customer Visible</option>
          </select>
          <button
            type="submit"
            disabled={isSubmitting || !newNote.trim()}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Add Note
              </>
            )}
          </button>
        </div>
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </form>

      {/* Notes List */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No notes yet. Add the first note to track progress.
          </p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className={cn(
                "rounded-lg border p-4",
                note.visibility === "CUSTOMER"
                  ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
                  : "border-border bg-card"
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">
                      {note.author?.name || "Unknown"}
                    </span>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        note.visibility === "CUSTOMER"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {note.visibility}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(note.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{note.body}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

