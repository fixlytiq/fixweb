"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { disputesApi, type Dispute, type DisputeStatus, type CreateDisputeDto, type CreateDisputeEvidenceDto } from "@/lib/api/disputes";
import { ticketsApi, type Ticket } from "@/lib/api/tickets";
import { 
  Plus, 
  Search, 
  AlertTriangle, 
  Edit, 
  Trash2, 
  Loader2, 
  X, 
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Image,
  File,
  Mic,
  MoreVertical,
  Filter,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const statusConfig: Record<DisputeStatus, { 
  label: string; 
  color: string; 
  icon: typeof AlertTriangle;
}> = {
  OPEN: {
    label: "Open",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    icon: AlertTriangle,
  },
  UNDER_REVIEW: {
    label: "Under Review",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    icon: Clock,
  },
  RESOLVED: {
    label: "Resolved",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    icon: CheckCircle2,
  },
  DISMISSED: {
    label: "Dismissed",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    icon: X,
  },
};

const evidenceTypeIcons: Record<string, typeof FileText> = {
  NOTE: FileText,
  DOCUMENT: File,
  IMAGE: Image,
  AUDIO: Mic,
  OTHER: MoreVertical,
};

export default function DisputesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [filteredDisputes, setFilteredDisputes] = useState<Dispute[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [editingDispute, setEditingDispute] = useState<Dispute | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateDisputeDto>({
    ticketId: "",
    summary: "",
    resolution: "",
  });

  // Evidence form state
  const [evidenceForm, setEvidenceForm] = useState<CreateDisputeEvidenceDto>({
    type: 'NOTE',
    url: "",
    description: "",
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (user && isAuthenticated) {
      fetchData();
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    filterDisputes();
  }, [searchQuery, statusFilter, disputes]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [disputesData, ticketsData] = await Promise.all([
        disputesApi.findAll().catch(() => []),
        ticketsApi.findAll().catch(() => []),
      ]);
      setDisputes(disputesData);
      setTickets(ticketsData);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const filterDisputes = () => {
    let filtered = [...disputes];

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((d) => d.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((d) => {
        const summary = d.summary?.toLowerCase() || "";
        const ticketTitle = d.Ticket?.title.toLowerCase() || "";
        return summary.includes(query) || ticketTitle.includes(query);
      });
    }

    setFilteredDisputes(filtered);
  };

  const handleOpenModal = (dispute?: Dispute) => {
    if (dispute) {
      setEditingDispute(dispute);
      setFormData({
        ticketId: dispute.ticketId || "",
        summary: dispute.summary,
        resolution: dispute.resolution || "",
      });
    } else {
      setEditingDispute(null);
      setFormData({
        ticketId: "",
        summary: "",
        resolution: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDispute(null);
    setFormData({
      ticketId: "",
      summary: "",
      resolution: "",
    });
  };

  const handleViewDetails = async (dispute: Dispute) => {
    try {
      const fullDispute = await disputesApi.findOne(dispute.id);
      setSelectedDispute(fullDispute);
      setIsDetailModalOpen(true);
    } catch (err: any) {
      console.error("Error fetching dispute details:", err);
      alert(err.message || "Failed to load dispute details");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.summary.trim()) {
      alert("Please provide a summary");
      return;
    }

    try {
      if (editingDispute) {
        await disputesApi.update(editingDispute.id, {
          ticketId: formData.ticketId || undefined,
          summary: formData.summary,
          resolution: formData.resolution || undefined,
        });
      } else {
        await disputesApi.create({
          ticketId: formData.ticketId || undefined,
          summary: formData.summary,
        });
      }
      handleCloseModal();
      fetchData();
    } catch (err: any) {
      console.error("Error saving dispute:", err);
      alert(err.message || "Failed to save dispute");
    }
  };

  const handleResolve = async (id: string) => {
    const resolution = prompt("Enter resolution details:");
    if (!resolution || !resolution.trim()) {
      return;
    }

    try {
      setIsProcessing(id);
      await disputesApi.resolve(id, resolution);
      fetchData();
    } catch (err: any) {
      console.error("Error resolving dispute:", err);
      alert(err.message || "Failed to resolve dispute");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDismiss = async (id: string) => {
    if (!confirm("Are you sure you want to dismiss this dispute?")) {
      return;
    }

    try {
      setIsProcessing(id);
      await disputesApi.dismiss(id);
      fetchData();
    } catch (err: any) {
      console.error("Error dismissing dispute:", err);
      alert(err.message || "Failed to dismiss dispute");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleAddEvidence = async () => {
    if (!selectedDispute) return;

    if (!evidenceForm.description?.trim() && !evidenceForm.url?.trim()) {
      alert("Please provide either a description or URL");
      return;
    }

    try {
      await disputesApi.addEvidence(selectedDispute.id, evidenceForm);
      setEvidenceForm({ type: 'NOTE', url: "", description: "" });
      const updated = await disputesApi.findOne(selectedDispute.id);
      setSelectedDispute(updated);
    } catch (err: any) {
      console.error("Error adding evidence:", err);
      alert(err.message || "Failed to add evidence");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this dispute?")) {
      return;
    }

    try {
      setIsProcessing(id);
      await disputesApi.remove(id);
      fetchData();
    } catch (err: any) {
      console.error("Error deleting dispute:", err);
      alert(err.message || "Failed to delete dispute");
    } finally {
      setIsProcessing(null);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const canManage = user && (user.role === 'OWNER' || user.role === 'MANAGER');

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Disputes</h1>
          <p className="text-muted-foreground mt-1">Manage customer disputes and resolutions</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Dispute
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search disputes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as DisputeStatus | "ALL")}
          className="px-4 py-2 rounded-lg border border-border bg-background"
        >
          <option value="ALL">All Statuses</option>
          {Object.keys(statusConfig).map((status) => (
            <option key={status} value={status}>{statusConfig[status as DisputeStatus].label}</option>
          ))}
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Disputes List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredDisputes.length === 0 ? (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {searchQuery || statusFilter !== "ALL"
              ? "No disputes found matching your filters"
              : "No disputes yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDisputes.map((dispute) => {
            const StatusIcon = statusConfig[dispute.status].icon;
            return (
              <div
                key={dispute.id}
                className="p-6 bg-card rounded-lg border border-border hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={cn("px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1", statusConfig[dispute.status].color)}>
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig[dispute.status].label}
                      </span>
                      {dispute.Ticket && (
                        <Link
                          href={`/tickets/${dispute.Ticket.id}`}
                          className="text-sm text-primary hover:underline"
                        >
                          Ticket: {dispute.Ticket.title}
                        </Link>
                      )}
                    </div>
                    <p className="font-medium mb-1">{dispute.summary}</p>
                    {dispute.resolution && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{dispute.resolution}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Opened: {new Date(dispute.openedAt).toLocaleDateString()}</span>
                      {dispute.resolvedAt && (
                        <span>Resolved: {new Date(dispute.resolvedAt).toLocaleDateString()}</span>
                      )}
                      {dispute._count && dispute._count.DisputeEvidence > 0 && (
                        <span>{dispute._count.DisputeEvidence} evidence item{dispute._count.DisputeEvidence !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDetails(dispute)}
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                      title="View details"
                    >
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </button>
                    {canManage && (
                      <>
                        {dispute.status === 'OPEN' && (
                          <button
                            onClick={() => handleResolve(dispute.id)}
                            disabled={isProcessing === dispute.id}
                            className="px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 text-sm"
                          >
                            {isProcessing === dispute.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Resolve'}
                          </button>
                        )}
                        {(dispute.status === 'OPEN' || dispute.status === 'UNDER_REVIEW') && (
                          <button
                            onClick={() => handleDismiss(dispute.id)}
                            disabled={isProcessing === dispute.id}
                            className="px-3 py-1.5 rounded-lg bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 text-sm"
                          >
                            {isProcessing === dispute.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Dismiss'}
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenModal(dispute)}
                          className="p-2 rounded-lg hover:bg-muted transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDelete(dispute.id)}
                          disabled={isProcessing === dispute.id}
                          className="p-2 rounded-lg hover:bg-destructive/10 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {isProcessing === dispute.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card rounded-lg border border-border shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="text-xl font-semibold">
                {editingDispute ? "Edit Dispute" : "New Dispute"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Related Ticket (Optional)</label>
                <select
                  value={formData.ticketId}
                  onChange={(e) => setFormData({ ...formData, ticketId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                >
                  <option value="">No ticket</option>
                  {tickets.map((ticket) => (
                    <option key={ticket.id} value={ticket.id}>{ticket.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Summary <span className="text-destructive">*</span>
                </label>
                <textarea
                  required
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background resize-none"
                  rows={4}
                  placeholder="Describe the dispute..."
                />
              </div>

              {editingDispute && (
                <div>
                  <label className="block text-sm font-medium mb-1">Resolution</label>
                  <textarea
                    value={formData.resolution || ""}
                    onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background resize-none"
                    rows={3}
                    placeholder="Resolution details..."
                  />
                </div>
              )}

              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {editingDispute ? "Update Dispute" : "Create Dispute"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg border border-border hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card rounded-lg border border-border shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="text-xl font-semibold">Dispute Details</h2>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedDispute(null);
                }}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Dispute Info */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className={cn("px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1", statusConfig[selectedDispute.status].color)}>
                    {statusConfig[selectedDispute.status].label}
                  </span>
                  {selectedDispute.Ticket && (
                    <Link
                      href={`/tickets/${selectedDispute.Ticket.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      View Ticket: {selectedDispute.Ticket.title}
                    </Link>
                  )}
                </div>
                <h3 className="font-semibold mb-2">Summary</h3>
                <p className="text-muted-foreground mb-4">{selectedDispute.summary}</p>
                {selectedDispute.resolution && (
                  <>
                    <h3 className="font-semibold mb-2">Resolution</h3>
                    <p className="text-muted-foreground">{selectedDispute.resolution}</p>
                  </>
                )}
              </div>

              {/* Evidence Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Evidence</h3>
                  <button
                    onClick={handleAddEvidence}
                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
                  >
                    Add Evidence
                  </button>
                </div>

                {/* Add Evidence Form */}
                <div className="p-4 bg-muted/50 rounded-lg mb-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={evidenceForm.type}
                      onChange={(e) => setEvidenceForm({ ...evidenceForm, type: e.target.value as any })}
                      className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                    >
                      <option value="NOTE">Note</option>
                      <option value="DOCUMENT">Document</option>
                      <option value="IMAGE">Image</option>
                      <option value="AUDIO">Audio</option>
                      <option value="OTHER">Other</option>
                    </select>
                    <input
                      type="url"
                      placeholder="URL (optional)"
                      value={evidenceForm.url}
                      onChange={(e) => setEvidenceForm({ ...evidenceForm, url: e.target.value })}
                      className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddEvidence}
                      className="px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
                    >
                      Add
                    </button>
                  </div>
                  <textarea
                    placeholder="Description"
                    value={evidenceForm.description}
                    onChange={(e) => setEvidenceForm({ ...evidenceForm, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background resize-none text-sm"
                    rows={2}
                  />
                </div>

                {/* Evidence List */}
                {selectedDispute.DisputeEvidence && selectedDispute.DisputeEvidence.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDispute.DisputeEvidence.map((evidence) => {
                      const Icon = evidenceTypeIcons[evidence.type] || FileText;
                      return (
                        <div key={evidence.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                          <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{evidence.type}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(evidence.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {evidence.description && (
                              <p className="text-sm text-muted-foreground mb-1">{evidence.description}</p>
                            )}
                            {evidence.url && (
                              <a
                                href={evidence.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                              >
                                {evidence.url}
                              </a>
                            )}
                          </div>
                          {canManage && (
                            <button
                              onClick={async () => {
                                if (confirm("Delete this evidence?")) {
                                  await disputesApi.removeEvidence(selectedDispute!.id, evidence.id);
                                  const updated = await disputesApi.findOne(selectedDispute!.id);
                                  setSelectedDispute(updated);
                                }
                              }}
                              className="p-1 rounded-lg hover:bg-destructive/10 text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No evidence added yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

