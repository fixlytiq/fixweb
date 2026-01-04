"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { vendorsApi, type Vendor, type CreateVendorDto } from "@/lib/api/vendors";
import { Plus, Search, Building2, Edit, Trash2, Loader2, Mail, Phone, Globe, FileText, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VendorsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateVendorDto>({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    website: "",
    notes: "",
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (user && isAuthenticated) {
      fetchVendors();
    }
  }, [user, isAuthenticated]);

  // Filter vendors based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredVendors(vendors);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = vendors.filter((vendor) => {
      const name = vendor.name?.toLowerCase() || "";
      const contactName = vendor.contactName?.toLowerCase() || "";
      const email = vendor.email?.toLowerCase() || "";
      const phone = vendor.phone?.toLowerCase() || "";
      
      return (
        name.includes(query) ||
        contactName.includes(query) ||
        email.includes(query) ||
        phone.includes(query)
      );
    });
    setFilteredVendors(filtered);
  }, [searchQuery, vendors]);

  const fetchVendors = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await vendorsApi.findAll();
      setVendors(data);
      setFilteredVendors(data);
    } catch (err: any) {
      console.error("Error fetching vendors:", err);
      setError(err.message || "Failed to load vendors");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (vendor?: Vendor) => {
    if (vendor) {
      setEditingVendor(vendor);
      setFormData({
        name: vendor.name || "",
        contactName: vendor.contactName || "",
        email: vendor.email || "",
        phone: vendor.phone || "",
        website: vendor.website || "",
        notes: vendor.notes || "",
      });
    } else {
      setEditingVendor(null);
      setFormData({
        name: "",
        contactName: "",
        email: "",
        phone: "",
        website: "",
        notes: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVendor(null);
    setFormData({
      name: "",
      contactName: "",
      email: "",
      phone: "",
      website: "",
      notes: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name.trim()) {
      alert("Vendor name is required");
      return;
    }

    // Check permissions
    if (user && user.role !== 'OWNER' && user.role !== 'MANAGER') {
      alert("You do not have permission to create or update vendors. Only Store Owners and Managers can manage vendors.");
      return;
    }

    try {
      if (editingVendor) {
        // Update existing vendor
        const updated = await vendorsApi.update(editingVendor.id, formData);
        setVendors(vendors.map((v) => (v.id === updated.id ? updated : v)));
      } else {
        // Create new vendor
        const newVendor = await vendorsApi.create(formData);
        setVendors([...vendors, newVendor]);
      }
      handleCloseModal();
      fetchVendors();
    } catch (err: any) {
      console.error("Error saving vendor:", err);
      
      if (err.statusCode === 401) {
        alert("Your session has expired. Please log in again.");
        router.push('/login');
        return;
      }
      
      if (err.statusCode === 403) {
        alert("You do not have permission to perform this action. Only Store Owners and Managers can manage vendors.");
        return;
      }
      
      alert(err.message || "Failed to save vendor");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vendor? This action cannot be undone.")) {
      return;
    }

    try {
      setIsDeleting(id);
      await vendorsApi.remove(id);
      setVendors(vendors.filter((v) => v.id !== id));
    } catch (err: any) {
      console.error("Error deleting vendor:", err);
      
      if (err.statusCode === 401) {
        alert("Your session has expired. Please log in again.");
        router.push('/login');
        return;
      }
      
      if (err.statusCode === 403) {
        alert("You do not have permission to delete vendors. Only Store Owners and Managers can delete vendors.");
        return;
      }
      
      alert(err.message || "Failed to delete vendor");
    } finally {
      setIsDeleting(null);
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
          <h1 className="text-3xl font-bold text-foreground">Vendors</h1>
          <p className="text-muted-foreground mt-1">Manage your vendor contacts and suppliers</p>
        </div>
        {canManage && (
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Vendor
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search vendors by name, contact, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Vendors List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {searchQuery ? "No vendors found matching your search" : "No vendors yet. Add your first vendor to get started."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVendors.map((vendor) => (
            <div
              key={vendor.id}
              className="p-6 bg-card rounded-lg border border-border hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{vendor.name}</h3>
                  {vendor.contactName && (
                    <p className="text-sm text-muted-foreground mb-2">Contact: {vendor.contactName}</p>
                  )}
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {vendor.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <a href={`mailto:${vendor.email}`} className="hover:text-primary">
                          {vendor.email}
                        </a>
                      </div>
                    )}
                    {vendor.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <a href={`tel:${vendor.phone}`} className="hover:text-primary">
                          {vendor.phone}
                        </a>
                      </div>
                    )}
                    {vendor.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <a 
                          href={vendor.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-primary truncate"
                        >
                          {vendor.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                {canManage && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenModal(vendor)}
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                      title="Edit vendor"
                    >
                      <Edit className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDelete(vendor.id)}
                      disabled={isDeleting === vendor.id}
                      className="p-2 rounded-lg hover:bg-destructive/10 transition-colors disabled:opacity-50"
                      title="Delete vendor"
                    >
                      {isDeleting === vendor.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {vendor.notes && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm text-muted-foreground line-clamp-2">{vendor.notes}</p>
                  </div>
                </div>
              )}

              {vendor._count && vendor._count.PurchaseOrder > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="text-xs text-muted-foreground">
                    {vendor._count.PurchaseOrder} purchase order{vendor._count.PurchaseOrder !== 1 ? 's' : ''}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card rounded-lg border border-border shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold">
                {editingVendor ? "Edit Vendor" : "Add Vendor"}
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
                <label className="block text-sm font-medium mb-1">
                  Vendor Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Acme Supplies Inc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Contact Name</label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="contact@acme.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://www.acme.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={3}
                  placeholder="Additional notes about this vendor..."
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {editingVendor ? "Update Vendor" : "Create Vendor"}
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
    </div>
  );
}

